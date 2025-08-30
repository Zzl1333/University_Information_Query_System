import functools
from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, current_app
from extensions import db
from models import UniversityMessage, DomesticUniversityRank, InternationalUniversityRank ,MajorRank,User_table
import time
import random
import crawler
admin_bp = Blueprint('admin_bp', __name__, template_folder='templates')


# ========== 登录校验装饰器 ==========
def admin_login_required(f):
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return redirect(url_for('admin_bp.admin_login_page'))
        return f(*args, **kwargs)

    return decorated_function


def admin_api_login_required(f):
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return jsonify({'error': '未授权'}), 401
        return f(*args, **kwargs)

    return decorated_function


# ========== 页面路由 ==========
@admin_bp.route('/admin/dashboard')
@admin_login_required
def admin_dashboard():
    return render_template('admin.html')


@admin_bp.route('/admin/login')
def admin_login_page():
    from flask import current_app  # 推迟导入 current_app
    return redirect(url_for('webui_bp.index') if 'webui_bp' in current_app.blueprints else url_for('index'))


@admin_bp.route('/admin/logout')
def admin_logout():
    session.pop('admin_logged_in', None)
    return redirect(url_for('webui_bp.index') if 'webui_bp' in current_app.blueprints else url_for('index'))


@admin_bp.route('/admin/api/login', methods=['POST'])
def admin_login_api():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # 查询数据库验证用户
    user = User_table.query.filter_by(user_name=username, code=password).first()

    if user and user.charter in ['管理员', '超级管理员']:  # 检查角色
        session['admin_logged_in'] = True
        return jsonify({
            "status": "success",
            "message": "登录成功",
            "redirect_url": url_for('admin_bp.admin_dashboard', _external=True)
        })
    else:
        return jsonify({
            "status": "fail",
            "message": "用户名或密码错误"
        }), 401


# ========== 高校管理 API ==========
@admin_bp.route('/admin/api/universities', methods=['GET', 'POST', 'PUT', 'DELETE'])
@admin_api_login_required
def universities_api():
    if request.method == 'GET':
        try:

            search_query = request.args.get('search', '')
            province_filter = request.args.get('province', '')
            type_filter = request.args.get('type', '')
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 10, type=int)

            query = db.session.query(
                UniversityMessage.university_name,
                UniversityMessage.location,
                UniversityMessage.type,
                UniversityMessage.is_active,
                DomesticUniversityRank.r2025,
            ).outerjoin(
                DomesticUniversityRank,
                UniversityMessage.university_name == DomesticUniversityRank.university_name
            )

            if search_query:
                query = query.filter(UniversityMessage.university_name.like(f'%{search_query}%'))
            if province_filter:
                query = query.filter(UniversityMessage.location == province_filter)
            if type_filter:
                query = query.filter(UniversityMessage.type == type_filter)

            total = query.count()
            results = query.offset((page - 1) * per_page).limit(per_page).all()

            universities = []
            for uni in results:
                universities.append({
                    "id": uni.university_name,
                    "name": uni.university_name,
                    "location": uni.location,
                    "type": uni.type if uni.type else "暂无",
                    "rank": uni.r2025 if uni.r2025 else "暂无",
                    "status": "已入库" if uni.is_active else "已删除"
                })

            return jsonify({
                "universities": universities,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page
            })
        except Exception as e:
            current_app.logger.error(f"GET error: {e}")
            return jsonify({"error": "获取高校数据失败", "details": str(e)}), 500
        finally:
            db.session.close()

    elif request.method == 'POST':
        data = request.get_json()
        name = data.get('name')
        location = data.get('location')
        uni_type = data.get('type')
        is_active = data.get('is_active', True)
        rank = data.get('rank')

        if not name or not location:
            return jsonify({"status": "fail", "message": "高校名称和省份不能为空"}), 400

        try:
            if db.session.query(UniversityMessage).filter_by(university_name=name).first():
                return jsonify({"status": "fail", "message": "高校已存在"}), 409

            new_uni = UniversityMessage(
                university_name=name,
                location=location,
                type=uni_type,
                is_active=is_active
            )
            db.session.add(new_uni)

            if rank:
                db.session.add(DomesticUniversityRank(university_name=name, r2025=rank))

            db.session.commit()
            return jsonify({"status": "success", "message": "高校添加成功"}), 201
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"POST error: {e}")
            return jsonify({"error": "添加高校失败", "details": str(e)}), 500
        finally:
            db.session.close()

    elif request.method == 'PUT':
        data = request.get_json()
        name = data.get('id')
        location = data.get('location')
        uni_type = data.get('type')
        is_active = data.get('is_active')
        rank = data.get('rank')

        if not name:
            return jsonify({"status": "fail", "message": "高校名称不能为空"}), 400

        try:
            uni = db.session.query(UniversityMessage).filter_by(university_name=name).first()
            if not uni:
                return jsonify({"status": "fail", "message": "高校未找到"}), 404

            if location:
                uni.location = location
            if uni_type:
                uni.type = uni_type
            if is_active is not None:
                uni.is_active = is_active

            rank_entry = db.session.query(DomesticUniversityRank).filter_by(university_name=name).first()
            if rank is not None:
                if rank_entry:
                    rank_entry.r2025 = rank
                else:
                    db.session.add(DomesticUniversityRank(university_name=name, r2025=rank))

            db.session.commit()
            return jsonify({"status": "success", "message": "高校信息更新成功"}), 200
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"PUT error: {e}")
            return jsonify({"error": "更新高校失败", "details": str(e)}), 500
        finally:
            db.session.close()

    elif request.method == 'DELETE':
        data = request.get_json()
        name = data.get('id')
        if not name:
            return jsonify({"status": "fail", "message": "高校名称不能为空"}), 400

        try:
            db.session.query(DomesticUniversityRank).filter_by(university_name=name).delete()
            db.session.query(InternationalUniversityRank).filter_by(university_name=name).delete()
            db.session.query(MajorRank).filter_by(university_name=name).delete()
            uni = db.session.query(UniversityMessage).filter_by(university_name=name).first()
            if uni:
                db.session.delete(uni)
            else:
                return jsonify({"status": "fail", "message": "高校未找到"}), 404

            db.session.commit()
            return jsonify({"status": "success", "message": "高校删除成功"}), 200
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"DELETE error: {e}")
            return jsonify({"error": "删除高校失败", "details": str(e)}), 500
        finally:
            db.session.close()


# ========== 用户管理 API ==========
@admin_bp.route('/admin/api/users', methods=['GET', 'POST', 'PUT', 'DELETE'])
@admin_api_login_required
def users_api():
    if request.method == 'GET':
        try:
            # 添加搜索参数
            search_query = request.args.get('search', '')

            # 查询数据库中的用户数据
            query = db.session.query(User_table)

            if search_query:
                query = query.filter(
                    (User_table.user_name.like(f'%{search_query}%')) |
                    (User_table.mail.like(f'%{search_query}%'))
                )

            users = query.all()

            # 转换为前端需要的格式
            user_list = []
            for user in users:
                user_list.append({
                    "id": user.ID,
                    "username": user.user_name,
                    "email": user.mail,
                    "role": user.charter,
                    "code": user.code
                })

            return jsonify(user_list)
        except Exception as e:
            return jsonify({"error": "获取用户数据失败", "details": str(e)}), 500
        finally:
            db.session.close()
    elif request.method == 'POST':
        data = request.get_json()
        try:
            new_user = User_table(
                ID=data.get('id'),
                user_name=data.get('username'),
                mail=data.get('email'),
                charter=data.get('role'),
                code=data.get('password')
            )
            db.session.add(new_user)
            db.session.commit()
            return jsonify({"status": "success", "message": "用户添加成功"}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "添加用户失败", "details": str(e)}), 500

    elif request.method == 'PUT':
        data = request.get_json()
        try:
            user = db.session.query(User_table).filter_by(ID=data.get('id')).first()
            if user:
                user.user_name = data.get('username', user.user_name)
                user.mail = data.get('email', user.mail)
                user.charter = data.get('role', user.charter)
                user.code = data.get('password', user.code)
                db.session.commit()
                return jsonify({"status": "success", "message": "用户信息更新成功"}), 200
            else:
                return jsonify({"status": "fail", "message": "用户未找到"}), 404
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "更新用户失败", "details": str(e)}), 500

    elif request.method == 'DELETE':
        data = request.get_json()
        try:
            user = db.session.query(User_table).filter_by(ID=data.get('id')).first()
            if user:
                db.session.delete(user)
                db.session.commit()
                return jsonify({"status": "success", "message": "用户删除成功"}), 200
            else:
                return jsonify({"status": "fail", "message": "用户未找到"}), 404
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "删除用户失败", "details": str(e)}), 500


@admin_bp.route('/admin/api/users/<user_id>', methods=['GET'])
@admin_api_login_required
def get_single_user(user_id):
    try:
        user = db.session.query(User_table).filter_by(ID=user_id).first()
        if not user:
            return jsonify({"error": "用户未找到"}), 404

        return jsonify({
            "id": user.ID,
            "username": user.user_name,
            "email": user.mail,
            "role": user.charter,
            "password": user.code
        })
    except Exception as e:
        return jsonify({"error": "获取用户数据失败", "details": str(e)}), 500
    finally:
        db.session.close()





# ========== 系统设置 API ==========
@admin_bp.route('/admin/api/settings', methods=['GET', 'PUT'])
@admin_api_login_required
def settings_api():
    if request.method == 'GET':
        return jsonify({
            "system_name": "高校专业数据分析平台",
            "version": "1.0.0",
            "contact_email": "support@example.com",
            "allow_registrations": False,
            "maintenance_mode": False,
            "data_update_frequency": "daily"
        })

    elif request.method == 'PUT':
        data = request.get_json()
        return jsonify({
            "status": "success",
            "message": "系统设置更新成功",
            "settings": data
        })


# ========== 统计数据 API ==========
@admin_bp.route('/admin/api/stats')
@admin_api_login_required
def get_stats():
    try:
        universities_count = db.session.query(UniversityMessage).count()
        majors_count = db.session.query(MajorRank).count()
        provinces_count = db.session.query(UniversityMessage.location).distinct().count()

        # 获取最近7天的访问数据（模拟）
        visits_data = {
            "labels": [f"{(i + 1)}天前" for i in range(6, -1, -1)],
            "data": [random.randint(50, 200) for _ in range(7)]
        }

        # 获取高校类型分布
        type_distribution = db.session.query(
            UniversityMessage.type,
            db.func.count(UniversityMessage.university_name)
        ).group_by(UniversityMessage.type).all()

        return jsonify({
            "universities": universities_count,
            "majors": majors_count,
            "provinces": provinces_count,
            "visits_today": visits_data["data"][-1],
            "visits_data": visits_data,
            "type_distribution": {
                "labels": [t[0] if t[0] else "未知" for t in type_distribution],
                "data": [t[1] for t in type_distribution]
            },
            "spider_status": "运行中",
            "model_status": "已加载",
            "db_status": "正常",
            "last_updated": time.strftime("%Y-%m-%d %H:%M:%S")
        })
    except Exception as e:
        return jsonify({"error": "获取统计数据失败", "details": str(e)}), 500
    finally:
        db.session.close()


@admin_bp.route('/admin/api/data_statistics')
@admin_api_login_required
def get_data_statistics():
    try:
        # 高校省份分布
        uni_dist = db.session.query(
            UniversityMessage.location,
            db.func.count(UniversityMessage.university_name)
        ).group_by(UniversityMessage.location).all()

        # 专业评级分布
        major_ratings = db.session.query(
            MajorRank.rating,
            db.func.count(MajorRank.id)
        ).group_by(MajorRank.rating).all()

        return jsonify({
            "university_distribution": {
                "labels": [x[0] for x in uni_dist],
                "data": [x[1] for x in uni_dist]
            },
            "major_rating_distribution": {
                "labels": [x[0] if x[0] else "未评级" for x in major_ratings],
                "data": [x[1] for x in major_ratings]
            }
        })
    except Exception as e:
        return jsonify({"error": "获取数据统计失败", "details": str(e)}), 500
    finally:
        db.session.close()


@admin_bp.route('/admin/api/universities/list')
@admin_api_login_required
def get_universities_list():
    try:
        universities = db.session.query(
            UniversityMessage.university_name
        ).filter(UniversityMessage.is_active == True).all()
        return jsonify([u[0] for u in universities])
    except Exception as e:
        return jsonify({"error": "获取高校列表失败", "details": str(e)}), 500
    finally:
        db.session.close()


