from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import ast
import re
import requests
import hashlib
from extensions import db
from admin import admin_bp
import models
import crawler
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # 替换为强密钥

CORS(app)
# 配置数据库 URI
HOSTNAME = '127.0.0.1'
PORT = 3306
USERNAME = 'root'
PASSWORD = '123456'
DATABASE = 'university_data'
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{USERNAME}:{PASSWORD}@{HOSTNAME}:{PORT}/{DATABASE}?charset=utf8'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # 禁用跟踪修改的开销

db.init_app(app) # 初始化 db 实例，将其与 Flask 应用关联

# 注册蓝图
app.register_blueprint(admin_bp)

# ================== 爬虫模块 ==================
# 预编译正则表达式
INVALID_CHAR_PATTERN = re.compile(r'[^a-z0-9\s-]')
SPACES_HYPHENS_PATTERN = re.compile(r'[\s-]+')
# 预加载大学列表
UNIVERSITY_LIST = None

# 获得英文校名

# ================== Flask 路由 ==================

@app.route('/')
def index():
    return render_template('webui.html')

@app.route('/admin')
def admin_page():
    if not session.get('admin_logged_in'):
        # 如果未登录，重定向到 admin 蓝图的登录页面
        return redirect(url_for('admin_bp.admin_login_page'))
    # 如果已登录，重定向到 admin 蓝图的仪表盘页面
    return redirect(url_for('admin_bp.admin_dashboard'))

@app.route('/api/university')
def query_university():
    # 获取大学名称和省份参数
    name = request.args.get('name', '').strip()
    province = request.args.get('province', '').strip()

    # 如果名称和省份都为空，则返回错误
    if not name and not province:
        return jsonify({'error': '请输入大学名称或省份进行查询'}), 400

    # 读取大学列表
    try:
        with open('universities.txt', 'r', encoding="utf-8") as fp:
            university_list_str = fp.read()
    except FileNotFoundError:
        return jsonify({'error': '大学数据文件未找到'}), 500

    result = []
    name_list_to_crawl = []
    pattern = r'\[\[\'[^\']+\'\], \[\'[^\']+\'\]\]'
    matches = re.findall(pattern, university_list_str)

    for match in matches:
        uni_info = ast.literal_eval(match)  # 安全解析字符串为列表
        university_name = uni_info[0][0].strip()  # 大学名称
        region = uni_info[1][0].strip()  # 所在地区

        # 根据名称和省份进行筛选
        name_match = (not name) or (name in university_name)
        province_match = (not province) or (province in region)

        if name_match and province_match:
            result.append({
                'university': university_name,  # 院校名称
                'region': region  # 地区
            })
            name_list_to_crawl.append(university_name)

    # 如果没有找到匹配的大学，返回404
    if not name_list_to_crawl:
        return jsonify({'error': '未找到相关大学信息'}), 404

    # 爬取匹配到的大学数据
    data = crawler.crawl_university_data_pool(name_list_to_crawl,app)

    # 如果爬取结果为空，也返回404
    if not data:
        return jsonify({'error': '未能获取到大学的详细信息'}), 404

    # 返回爬取到的数据列表
    return jsonify(data)


@app.route('/app/api/universities_1',methods=['POST'])
def get_crawler_uni():
    data = request.get_json()
    university_name = data['name']
    # 获取大学的URL
    url = crawler.get_university_url([university_name])[0]  # 假设返回的是一个包含单个URL的列表
    with requests.Session() as session:
        crawler.crawl_university_data(url, session, app)
    return {'status': 'success', 'message': '高校数据爬取成功'}

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    url = 'http://localhost:11434/api/generate'
    question = data.get('question', '')
    data = {
        'model': 'model4:latest',
        'prompt': question,
        'stream': False
    }
    response = requests.post(url=url,json=data)
    text = response.json()['response']
    print(text)
    cleaned_text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    print(cleaned_text)
    return jsonify({'reply': cleaned_text})

@app.route('/check_ollama', methods=['GET'])
def check_ollama():
    try:
        # 尝试连接Ollama服务
        response = requests.get('http://localhost:11434', timeout=2)
        return jsonify({
            "status": "running",
            "version": response.headers.get('Ollama-Version', 'unknown')
        })
    except requests.ConnectionError:
        return jsonify({"status": "not_running"}), 503
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500



if __name__ == '__main__':
    with app.app_context():
        db.create_all() # 在应用上下文内创建所有数据库表
    app.run(debug=True)