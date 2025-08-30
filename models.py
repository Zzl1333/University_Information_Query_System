
from extensions import db # 从 extensions.py 导入 db 实例

class UniversityMessage(db.Model):
    __tablename__ = 'university_message'
    university_name = db.Column(db.String(20), primary_key=True)
    title = db.Column(db.String(20))
    location = db.Column(db.String(20))
    photo = db.Column(db.String(70))
    official_website = db.Column(db.String(70))
    evaluation = db.Column(db.String(25))
    type = db.Column(db.String(64), default='未知')       # 高校类型
    is_active = db.Column(db.Boolean, default=True)       # 是否启用

    def __init__(self, university_name, title, location, photo, official_website, evaluation):
        self.university_name = university_name
        self.title = title
        self.location = location
        self.photo = photo
        self.official_website = official_website
        self.evaluation = evaluation

class User_table(db.Model):
    __tablename__ = 'user_table'
    ID = db.Column(db.String,primary_key = True)
    user_name = db.Column(db.String(20))
    mail = db.Column(db.String(20))
    charter = db.Column(db.String(20))
    code = db.Column(db.String(20))
    def __init__(self, ID, user_name, mail, charter, code):
        self.ID = ID
        self.user_name = user_name
        self.mail = mail
        self.charter = charter
        self.code = code



class DomesticUniversityRank(db.Model):
    __tablename__ = 'university_ranking_in_china'
    university_name = db.Column(db.String(20), primary_key=True)
    r2021 = db.Column(db.String(10))
    r2022 = db.Column(db.String(10))
    r2023 = db.Column(db.String(10))
    r2024 = db.Column(db.String(10))
    r2025 = db.Column(db.String(10))

    def __init__(self, university_name, r2021, r2022, r2023, r2024, r2025):
        self.university_name = university_name
        self.r2021 = r2021
        self.r2022 = r2022
        self.r2023 = r2023
        self.r2024 = r2024
        self.r2025 = r2025


class InternationalUniversityRank(db.Model):
    __tablename__ = 'university_ranking_in_world'
    university_name = db.Column(db.String(20), primary_key=True)
    r2021 = db.Column(db.String(10))
    r2022 = db.Column(db.String(10))
    r2023 = db.Column(db.String(10))
    r2024 = db.Column(db.String(10))
    r2025 = db.Column(db.String(10))

    def __init__(self, university_name, r2021, r2022, r2023, r2024, r2025):
        self.university_name = university_name
        self.r2021 = r2021
        self.r2022 = r2022
        self.r2023 = r2023
        self.r2024 = r2024
        self.r2025 = r2025


class MajorRank(db.Model):
    __tablename__ = 'university_speciaty_ranking'
    university_name = db.Column(db.String(20), primary_key=True)
    specialty_name = db.Column(db.String(20), primary_key=True)
    rating = db.Column(db.String(2))
    specialty_ranking = db.Column(db.String(10))

    def __init__(self, university_name, specialty_name, rating, specialty_ranking):
        self.university_name = university_name
        self.specialty_name = specialty_name
        self.rating = rating
        self.specialty_ranking = specialty_ranking

def save(data):

    name_list = db.session.query(UniversityMessage.university_name).all()
    name_list_str = [item[0] for item in name_list]
    if data['university_name'][0] in name_list_str:
        return 0
    # 直接使用 db.session，假设此函数在 Flask 应用上下文中被调用
    university_name = data['university_name'][0]
    title = data['title']
    location = data['location']
    photo = data['photo']
    official_website = data['official_website'][0]
    evaluation = data['evaluation']

    db.session.add(UniversityMessage(university_name, title, location, photo, official_website, evaluation))
    ranking_china = data['ranking_china']
    tmp_year = {}
    for year in range(2021, 2026):
        tmp_year[str(year)] = ranking_china.get(str(year), "") # 使用 .get() 防止 KeyError
    db.session.add(DomesticUniversityRank(university_name, tmp_year['2021'], tmp_year['2022'],
                                          tmp_year['2023'], tmp_year['2024'], tmp_year['2025']))
    ranking_world = data['ranking_world']
    tmp_year = {}
    for year in range(2021, 2026):
        tmp_year[str(year)] = ranking_world.get(str(year), "")
    db.session.add(InternationalUniversityRank(university_name, tmp_year['2021'], tmp_year['2022'],
                                               tmp_year['2023'], tmp_year['2024'],
                                               tmp_year['2025']))
    for item in data['specialties']:
        specialty_name = item['specialty_name']
        rating = item['rating']
        specialty_ranking = item['specialty_ranking']
        # 注意: MajorRank 的第一个参数是 university_name，第二个是 specialty_name
        # 原代码中两个参数都是 specialty_name，这里修正为 university_name
        db.session.add(MajorRank(university_name, specialty_name, rating, specialty_ranking))
    db.session.commit()
    # db.session.close() 通常不需要手动调用，Flask-SQLAlchemy会在请求结束后自动关闭
    return 'success'


def addUniversity(university):
    # 直接使用 db.session，假设此函数在 Flask 应用上下文中被调用
    r = db.session.query(UniversityMessage).filter_by(university_name=university).first()
    if r: # 如果找到了，r 就不是 None
        return False, '已经存入数据库'

    data = {}  # 爬虫逻辑，这里假设会填充数据
    # 调用 save 函数，它会使用 db.session.add 和 db.session.commit
    save(data)
    return True, '新增成功' # 假设 save 成功

def removeUniversity(university):
    # 直接使用 db.session，假设此函数在 Flask 应用上下文中被调用
    # 检查是否存在
    r = db.session.query(UniversityMessage).filter_by(university_name=university).first()
    if not r:
        return False, '未存入数据库'

    try:
        # 删除与该大学相关的所有数据
        db.session.query(UniversityMessage).filter_by(university_name=university).delete()
        db.session.query(DomesticUniversityRank).filter_by(university_name=university).delete()
        db.session.query(InternationalUniversityRank).filter_by(university_name=university).delete()
        # 对于 MajorRank，由于 university_name 也是 primary_key 的一部分，可以直接删除
        db.session.query(MajorRank).filter_by(university_name=university).delete()

        db.session.commit()
        return True, '删除成功'
    except Exception as e:
        db.session.rollback() # 发生错误时回滚事务
        return False, str(e)

# if __name__ == '__main__':
# 这部分通常用于测试或脚本，在应用启动时不需要运行
# removeUniversity('内蒙古大学')