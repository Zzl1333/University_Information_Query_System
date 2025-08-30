
import requests
from lxml import etree
import ast
import headers
import re
import hashlib
import random
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import models

# ================== 爬虫模块 ==================
# 预编译正则表达式
INVALID_CHAR_PATTERN = re.compile(r'[^a-z0-9\s-]')
SPACES_HYPHENS_PATTERN = re.compile(r'[\s-]+')
# 预加载大学列表
UNIVERSITY_LIST = None


def translate_baidu(query, appid, secret_key, session=None, from_lang='zh', to_lang='en'):
    url = "https://fanyi-api.baidu.com/api/trans/vip/translate"
    salt = random.randint(32768, 65536)
    query_str = "\n".join(query)
    sign_str = appid + query_str + str(salt) + secret_key
    sign = hashlib.md5(sign_str.encode('utf-8')).hexdigest()

    params = {
        'q': query_str,
        'from': from_lang,
        'to': to_lang,
        'appid': appid,
        'salt': salt,
        'sign': sign
    }

    # 使用传入的session或创建临时session
    use_temp_session = session is None
    if use_temp_session:
        session = requests.Session()

    try:
        response = session.get(url, params=params, headers=headers.random_headers(), timeout=5)
        response.raise_for_status() # Raises HTTPError for bad responses (4xx or 5xx)
        result = response.json()
        urls = []
        if 'trans_result' in result:
            for item in result['trans_result']:
                name = item['dst'].lower().strip()
                name = INVALID_CHAR_PATTERN.sub('', name)
                name = SPACES_HYPHENS_PATTERN.sub('-', name)
                urls.append(f"https://www.shanghairanking.cn/institution/{name}")
        return urls
    except requests.RequestException as e:
        print(f"网络请求失败: {e}")
    except KeyError as e:
        print(f"解析响应结果失败: {e}, 响应内容: {response.text}")
    except Exception as e:
        print(f"翻译失败: {e}")
    finally:
        # 如果是临时创建的session，使用后关闭
        if use_temp_session:
            session.close()
    return None

def get_university_url(need_name):
    appid = "20250714002405611"  # 替换为你的百度APPID
    secret_key = "I6hY6mgsP5c7SS_eTECG"  # 替换为你的百度密钥
    with requests.Session() as session:
        return translate_baidu(need_name, appid, secret_key, session=session)

def crawl_university_data_pool(university_names,app):
    data_fin_list = list()
    begin = time.time()
    print(begin)
    urls = get_university_url(university_names)
    name_url_map = {name: url for name, url in zip(university_names, urls) if url}
    data_fin_list = []
    with ThreadPoolExecutor(max_workers=15) as executor:
        with requests.Session() as session:
            # 创建任务
            futures = {
                executor.submit(crawl_university_data, url, session,app): name
                for name, url in name_url_map.items()
            }

            # 处理结果
            for future in as_completed(futures):
                name = futures[future]
                try:
                    data = future.result()
                    if data:
                        data_fin_list.append(data)
                        print(f"成功爬取: {name}")
                except Exception as e:
                    print(f"爬取 {name} 失败: {str(e)}")
    # 返回或处理 data_fin_list
    print(time.time() - begin)
    return data_fin_list

def crawl_university_data(url, session,app):
    response = session.get(url=url, headers=headers.random_headers())
    if response.status_code != 404:
        response.encoding = 'utf-8'
        tree = etree.HTML(response.text)
        try:
            offi = tree.xpath('//*[@id="univ_addr"]/div[3]/span/text()')[0],
        except IndexError: # Use IndexError for empty lists
            try:
                offi = tree.xpath('//*[@id="univ_addr"]/div[2]/span/text()')[0],
            except IndexError:
                offi = None # Handle case where neither path works
        try:
            eva = tree.xpath('//*[@id="rk_comments"]/span/text()')[0]
        except IndexError:
            eva = None
        data = {
            "university_name": tree.xpath('//*[@id="univ_name"]/span[1]/text()'),
            "title": ",".join([t for t in tree.xpath('//*[@id="univ_tags"]/div/text()')]),
            "location": tree.xpath('//*[@id="univ_addr"]/div[1]/span/text()')[0],
            "official_website": offi[0] if offi else None, # Access tuple element if exists
            "history": ''.join(tree.xpath('//*[@id="univ_intro"]/div/p/text()')),
            "photo": tree.xpath('//*[@id="univ_logo"]/@src'),
            "ranking_china": {},
            "ranking_world": {},
            "specialties": {},
            "evaluation": eva,
            "kind_ranking": tree.xpath('//*[@id="bcur_latest"]/div[1]/div/div[2]/span/text()')
        }

        # 国内排名
        china = dict()
        for item in tree.xpath('//*[@id="bcur_hist"]/div'):
            year = item.xpath('div[2]/text()')
            rank = item.xpath('div[1]/text()')
            if year and rank: # Check if lists are not empty
                if rank[0] == "500+":
                    base = int(rank[0].replace('+', ''))
                    upper_limit = base + 100
                    result = random.randint(base, upper_limit)
                    china[year[0]] = str(result) # Store as string
                else:
                    china[year[0]] = rank[0]
        data["ranking_china"] = china

        # 世界排名
        world = dict()
        for item in tree.xpath('//*[@id="arwu_hist"]/div/div'):
            year = item.xpath('div/text()')
            rank = item.xpath('span[1]/text()')
            if year and rank: # Check if lists are not empty
                pattern = r'^\d+-\d+$'
                if re.match(pattern, rank[0]):
                    start, end = map(float, rank[0].split('-'))
                    result = random.uniform(start, end)
                    world[year[0]] = str(int(result)) # Store as string
                else:
                    world[year[0]] = rank[0]
        data["ranking_world"] = world

        li = list()
        # 专业评分
        for item in tree.xpath('//*[@id="bcmr"]/div[3]/div[2]/div[2]/table/tbody/tr'):
            specialty_name = item.xpath('td[1]/text()')
            rating = item.xpath('td[2]/text()')
            specialty_ranking = item.xpath('td[3]/text()')
            if specialty_name and rating and specialty_ranking: # Check if lists are not empty
                ls_dict = {
                    'specialty_name': specialty_name[0],
                    'rating': rating[0],
                    "specialty_ranking": specialty_ranking[0],
                }
                li.append(ls_dict)
        data["specialties"] = li
        print(data)
        with app.app_context():  # 使用正确的 app 实例创建应用上下文
            models.save(data)
        return data
    return None # Return None if status_code is 404