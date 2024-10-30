import jwt
import datetime
import bcrypt
import json
import nltk
import re
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from functools import wraps
from pymongo import MongoClient
from bson import ObjectId
from bson import json_util
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk import pos_tag
from nltk.corpus import wordnet

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'secret123'

nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('averaged_perceptron_tagger')

client = MongoClient("mongodb://127.0.0.1:27017")
db = client.COM668_Database
users_collection = db.Users 
intents_collection = db.Intents
courses_collection = db.Courses
campuses_collection = db.Campuses
blacklist = db.blacklist

lemmatizer = WordNetLemmatizer()
campus_names = campuses_collection.distinct('name')
campus_pattern = re.compile(r'\b(' + '|'.join(campus_names) + r')\b', re.IGNORECASE)

def jwt_required(func):
    @wraps(func)
    def jwt_required_wrapper(*args, **kwargs):
        token = None
        if 'x-access-token' in request.headers:
            token = request.headers['x-access-token']

        bl_token = blacklist.find_one({"token": token})
        if bl_token is not None:
            return make_response(jsonify({'message': 'Token has been cancelled'}), 401)
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            return func(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return make_response(jsonify({'message': 'Token has expired'}), 401)
        except jwt.InvalidTokenError:
            return make_response(jsonify({'message': 'Invalid token'}), 401)

    return jwt_required_wrapper


def admin_required(func):
    @wraps(func)
    def admin_required_wrapper(*args, **kwargs):
        token = request.headers.get('x-access-token')
        if token:
            try:
                token_data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
                username = token_data.get('username')
                user_roles = token_data.get('roles', [])
                if 'admin' in user_roles:
                    return func(*args, **kwargs)
                else:
                    return make_response(jsonify({'message': 'Admin access required'}), 401)
            except jwt.ExpiredSignatureError:
                return make_response(jsonify({'message': 'Token has expired'}), 401)
            except jwt.InvalidTokenError:
                return make_response(jsonify({'message': 'Invalid token'}), 401)
        else:
            return make_response(jsonify({'message': 'Token not provided'}), 401)

    return admin_required_wrapper


def check_admin_credentials(username, password):
    user = users_collection.find_one({'username': username})
    if user:
        hashed_password = user['password']
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode('utf-8')
        if bcrypt.checkpw(password.encode('utf-8'), hashed_password):
            return user.get('admin', False)
    return False


@app.route('/api/v1.0/login', methods=['POST'])
def login():
    auth = request.authorization
    if auth:
        username = auth.get('username')
        password = auth.get('password')
        user = users_collection.find_one({'username': username})
        if user:
            hashed_password = user['password']
            if isinstance(hashed_password, str):
                hashed_password = hashed_password.encode('utf-8')
            if bcrypt.checkpw(password.encode('utf-8'), hashed_password):
                token = jwt.encode(
                    {'username': username,
                     'roles': user.get('roles', []),
                     'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=90)
                     }, app.config['SECRET_KEY'], algorithm='HS256')
                return make_response(jsonify({'token': token}), 200)
            else:
                return make_response(jsonify({'message': 'Invalid username or password'}), 401)
        else:
            return make_response(jsonify({'message': 'Invalid username or password'}), 401)
    else:
        return make_response(jsonify({'message': 'Invalid request'}), 400)


@app.route('/api/v1.0/logout', methods=["GET"])
def logout():
    token = request.headers.get('x-access-token')
    if token:
        return make_response(jsonify({'message': 'Logout successful'}), 200)
    else:
        return make_response(jsonify({'message': 'No token provided'}), 401)
    

@app.route('/api/v1.0/profile', methods=['GET'])
@jwt_required
def user_profile():
    token = request.headers.get('x-access-token')
    if token:
        try:
            token_data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            username = token_data.get('username')
            print(token_data)
            if username:
                user = users_collection.find_one({'username': username}, {'_id': 0, 'password': 0})
                if user:
                    return jsonify(user), 200
                else:
                    return jsonify({'message': 'User not found'}), 403
            else:
                return jsonify({'message': 'Username not found in token'}), 403
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 403
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 403
    else:
        return jsonify({'message': 'Token not provided'}), 401


def nltk_to_wordnet_pos(nltk_pos):
    if nltk_pos.startswith('J'):
        return wordnet.ADJ
    elif nltk_pos.startswith('V'):
        return wordnet.VERB
    elif nltk_pos.startswith('N'):
        return wordnet.NOUN
    elif nltk_pos.startswith('R'):
        return wordnet.ADV
    else:
        return None
    

def preprocess_text(text):
    if text is None:
        return []

    tokens = word_tokenize(text.lower())
    
    stop_words = set(stopwords.words('english'))
    filtered_tokens = [token for token in tokens if token not in stop_words]
    
    lemmatized_tokens = []
    for token, pos in pos_tag(filtered_tokens):
        wordnet_pos = nltk_to_wordnet_pos(pos) or wordnet.NOUN
        lemmatized_token = lemmatizer.lemmatize(token, pos=wordnet_pos)
        lemmatized_tokens.append(lemmatized_token)
    
    return lemmatized_tokens


def generate_response(user_input, intents, user_roles):
    preprocessed_input = preprocess_text(user_input)
    
    filtered_intents = []

    for intent in intents:
        intent_roles = intent.get("roles", [])

        if "all" in intent_roles or not set(intent_roles).isdisjoint(user_roles):
            filtered_intents.append(intent)

    if not filtered_intents:
        return "I'm sorry, I don't understand that."

    matched_intents = []

    for intent in filtered_intents:
        patterns = intent.get("pattern")
        if patterns is None:
            print("Error: No patterns found for intent:", intent)
            continue

        match_count = 0
        for pattern in patterns:
            pattern_tokens = preprocess_text(pattern)
            if set(pattern_tokens).issubset(preprocessed_input):
                match_count += 1
        matched_intents.append((intent, match_count))

    if not matched_intents:
        return "I'm sorry, I don't understand that."

    matched_intents.sort(key=lambda x: x[1], reverse=True)

    top_intent = matched_intents[0][0]
    response = top_intent["responses"][0]
    
    return response


def load_intents_from_mongodb():
    intents = intents_collection.find({})
    return list(intents)

@app.route('/api/v1.0/chatbot', methods=['POST'])
def chatbot():
    user_input = request.form.get('user_input', '')

    if not user_input:
        return jsonify({'response': "Please provide input."}), 400 

    try:
        intents = load_intents_from_mongodb()
        if not intents:
            return jsonify({'response': "No intents found in the database."}), 500 

        user_role = "all"
        campus_name = extract_campus_name(user_input)
        if campus_name:
            campus = campuses_collection.find_one({'name': campus_name})
            if campus:
                response = f"The {campus_name} campus is located at {campus['location']}."
                return jsonify({'response': response}), 200
            else:
                return jsonify({'response': f"No information found for {campus_name} campus."}), 200

        response = generate_response(user_input, intents, [user_role])
        return jsonify({'response': response}), 200
    except Exception as e:
        return jsonify({'response': f"An error occurred: {e}"}), 500
    

def extract_campus_name(user_input):
    match = campus_pattern.search(user_input)
    if match:
        return match.group(1).capitalize() 
    return None


def query_courses_by_campus(campus_name):
    courses = courses_collection.find({'campus': campus_name}, {'name': 1})
    return [course['name'] for course in courses]


def extract_course_code(user_input):
    words = user_input.split()
    for word in words:
        if word.isalnum() and word.isupper():
            return word
    return None


def query_lecturer_by_course(course_code):
    course = courses_collection.find_one({'code': course_code}, {'lecturer': 1})
    if course:
        return course.get('lecturer', 'Unknown')
    else:
        return 'Unknown'


@app.route('/api/v1.0/users', methods=['GET'])
# @admin_required
def get_users():
    users = users_collection.find({}, {'_id': 0, 'password': 0})
    user_list = list(users)
    return jsonify({'users': user_list}), 200


@app.route('/api/v1.0/users/<username>', methods=['GET'])
# @admin_required
def get_user(username):
    user = users_collection.find_one({'username': username}, {'_id': 0, 'password': 0})
    if user:
        return jsonify(user), 200
    else:
        return jsonify({'message': 'User not found'}), 404


@app.route('/api/v1.0/users/search', methods=['GET'])
# @admin_required
def search_users():
    query = request.args.get('query', '')
    role = request.args.get('role', '')

    search_criteria = {}

    if query:
        search_criteria['username'] = {'$regex': query, '$options': 'i'}

    if role:
        if role.lower() in ['admin', 'staff', 'student']:
            search_criteria['roles'] = role.lower()
        else:
            return make_response(jsonify({'message': 'Invalid role provided'}), 400)

    if search_criteria:
        users = users_collection.find(search_criteria, {'_id': 0, 'password': 0})
        user_list = [user for user in users]
        return make_response(jsonify({'users': user_list}), 200)
    else:
        return make_response(jsonify({'message': 'Please provide a search query or role'}), 400)


@app.route('/api/v1.0/users', methods=['POST'])
# @admin_required
def create_user():
    username = request.form.get('username')
    password = request.form.get('password')
    roles = request.form.getlist('roles')

    if username and password and roles:
        existing_user = users_collection.find_one({'username': username})
        if existing_user:
            return jsonify({'message': 'Username already exists'}), 200
        else:
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            admin = 'admin' in roles 
            user_data = {
                'username': username,
                'password': hashed_password.decode('utf-8'),  
                'roles': roles,
                'name': request.form.get('name'),
                'date_of_birth': request.form.get('date_of_birth'),
                'email': request.form.get('email'),
                'courses': request.form.getlist('courses'),
                'admin': admin
            }
            users_collection.insert_one(user_data)
            return jsonify({'message': 'User created successfully'}), 201
    else:
        return jsonify({'message': 'Username, password, and roles are required'}), 400


@app.route('/api/v1.0/users/<username>', methods=['PUT'])
# @admin_required
def update_user(username):
    password = request.form.get('password')
    roles = request.form.getlist('roles')

    if roles:
        existing_user = users_collection.find_one({'username': username})
        if existing_user:
            existing_hashed_password = existing_user.get('password')

            if password:
                hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            else:
                hashed_password = existing_hashed_password

            admin = 'admin' in roles
            update_data = {'password': hashed_password, 'roles': roles, 'admin': admin}
            update_data['name'] = request.form.get('name')
            update_data['date_of_birth'] = request.form.get('date_of_birth')
            update_data['email'] = request.form.get('email')
            update_data['courses'] = request.form.getlist('courses')

            update_result = users_collection.update_one(
                {'username': username},
                {'$set': update_data}
            )

            if update_result.modified_count > 0:
                return jsonify({'message': 'User updated successfully'}), 200
            else:
                return jsonify({'message': 'User not found'}), 404
        else:
            return jsonify({'message': 'User not found'}), 404
    else:
        return jsonify({'message': 'Roles are required'}), 400


@app.route('/api/v1.0/users/<username>', methods=['DELETE'])
# @admin_required
def delete_user(username):
    delete_result = users_collection.delete_one({'username': username})
    if delete_result.deleted_count > 0:
        return jsonify({'message': 'User deleted successfully'}), 200
    else:
        return jsonify({'message': 'User not found'}), 404


@app.route('/api/v1.0/intents/<intent_id>', methods=['GET'])
# @admin_required
def get_intent(intent_id):
    intent = intents_collection.find_one({'_id': ObjectId(intent_id)})
    if intent:

        intent['_id'] = str(intent['_id'])
        return jsonify(intent), 200
    else:
        return jsonify({'message': 'Intent not found'}), 404


@app.route('/api/v1.0/intents', methods=['GET'])
# @admin_required
def get_intents():
    intents = intents_collection.find({})

    intent_list = [json.loads(json_util.dumps(intent)) for intent in intents]
    return jsonify(intent_list), 200


@app.route('/api/v1.0/intents/search', methods=['GET'])
# @admin_required
def search_intents():
    query = request.args.get('query')

    if query:
        intents = intents_collection.find({'$or': [
            {'tag': {'$regex': query, '$options': 'i'}},
            {'pattern': {'$regex': query, '$options': 'i'}},
            {'responses': {'$regex': query, '$options': 'i'}},
            {'roles': {'$regex': query, '$options': 'i'}}
        ]})

        intent_list = []
        for intent in intents:
            intent['_id'] = str(intent['_id'])
            intent_list.append(intent)

        return jsonify(intent_list), 200
    else:
        return jsonify({'message': 'Please provide a search query'}), 400


@app.route('/api/v1.0/intents', methods=['POST'])
# @admin_required
def create_intent():
    tag = request.form.get('tag')
    pattern = request.form.get('pattern')
    responses = request.form.getlist('responses')
    roles = request.form.getlist('roles')

    if tag and pattern and responses and roles:
        new_intent = {
            'tag': tag,
            'pattern': pattern,
            'responses': responses,
            'roles': roles,
            'feedback': [],
            'num_times_used': 0, 
            'helpful': 0, 
            'not_helpful': 0 
        }
        intent_id = intents_collection.insert_one(new_intent).inserted_id
        return jsonify({'message': 'Intent created successfully', 'intent_id': str(intent_id)}), 201, {'Content-Type': 'application/json'}
    else:
        return jsonify({'message': 'Tag, pattern, responses, and roles are required'}), 400, {'Content-Type': 'application/json'}


@app.route('/api/v1.0/intents/<intent_id>', methods=['PUT'])
# @admin_required
def update_intent(intent_id):
    tag = request.form.get('tag')
    pattern = request.form.get('pattern')
    responses = request.form.getlist('responses')
    roles = request.form.getlist('roles')

    if tag and pattern and responses and roles:
        update_data = {
            'tag': tag,
            'pattern': pattern,
            'responses': responses,
            'roles': roles
        }
        update_result = intents_collection.update_one(
            {'_id': ObjectId(intent_id)},
            {'$set': update_data}
        )
        if update_result.modified_count > 0:
            return jsonify({'message': 'Intent updated successfully'}), 200, {'Content-Type': 'application/json'}
        else:
            return jsonify({'message': 'Intent not found'}), 404, {'Content-Type': 'application/json'}
    else:
        return jsonify({'message': 'Tag, pattern, responses, and roles are required'}), 400, {'Content-Type': 'application/json'}
    

@app.route('/api/v1.0/intents/<intent_id>', methods=['DELETE'])
# @admin_required
def delete_intent(intent_id):
    delete_result = intents_collection.delete_one({'_id': ObjectId(intent_id)})
    if delete_result.deleted_count > 0:
        return jsonify({'message': 'Intent deleted successfully'}), 200, {'Content-Type': 'application/json'}
    else:
        return jsonify({'message': 'Intent not found'}), 404, {'Content-Type': 'application/json'}


@app.route('/api/v1.0/intents/<intent_id>/feedback', methods=['POST'])
# @jwt_required
def add_intent_feedback(intent_id):
    intent = intents_collection.find_one({"_id": ObjectId(intent_id)})
    if not intent:
        return make_response(jsonify({"error": "Intent not found"}), 404)

    feedback = request.form.get('feedback')
    helpful = request.form.get('helpful')
    not_helpful = request.form.get('not_helpful')

    if helpful == '1':
        intents_collection.update_one({"_id": ObjectId(intent_id)}, {"$inc": {"helpful": 1}})
    elif not_helpful == '1':
        intents_collection.update_one({"_id": ObjectId(intent_id)}, {"$inc": {"not_helpful": 1}})
    elif not (helpful or not_helpful): 
        return make_response(jsonify({"error": "Either helpful or not_helpful field must be provided"}), 400)

    if not feedback:
        return make_response(jsonify({"message": "Please provide feedback for why you found the response not helpful"}), 400)
    else:
        intents_collection.update_one({"_id": ObjectId(intent_id)}, {"$push": {"feedback": feedback}})

    return make_response(jsonify({"message": "Feedback and vote added successfully"}), 200)


@app.route('/api/v1.0/intents/<intent_id>/feedback', methods=['GET'])
# @admin_required
def get_all_intent_feedback(intent_id):
    intent = intents_collection.find_one({"_id": ObjectId(intent_id)})
    if not intent:
        return make_response(jsonify({"error": "Intent not found"}), 404)

    feedback = intent.get('feedback', [])
    return make_response(jsonify({"feedback": feedback}), 200)


@app.route('/api/v1.0/intents/<intent_id>/feedback/<feedback_index>', methods=['GET'])
# @admin_required
def get_intent_feedback(intent_id, feedback_index):
    intent = intents_collection.find_one({"_id": ObjectId(intent_id)})
    if not intent:
        return make_response(jsonify({"error": "Intent not found"}), 404)

    feedback = intent.get('feedback', [])
    try:
        feedback_index = int(feedback_index)
        if feedback_index < 0 or feedback_index >= len(feedback):
            return make_response(jsonify({"error": "Feedback index out of range"}), 400)
        return make_response(jsonify({"feedback": feedback[feedback_index]}), 200)
    except ValueError:
        return make_response(jsonify({"error": "Invalid feedback index"}), 400)


@app.route('/api/v1.0/intents/<intent_id>/feedback/<feedback_index>', methods=['DELETE'])
# @admin_required
def delete_intent_feedback(intent_id, feedback_index):
    intent = intents_collection.find_one({"_id": ObjectId(intent_id)})
    if not intent:
        return make_response(jsonify({"error": "Intent not found"}), 404)

    feedback = intent.get('feedback', [])
    try:
        feedback_index = int(feedback_index)
        if feedback_index < 0 or feedback_index >= len(feedback):
            return make_response(jsonify({"error": "Feedback index out of range"}), 400)
        del feedback[feedback_index]
        intents_collection.update_one({"_id": ObjectId(intent_id)}, {"$set": {"feedback": feedback}})
        return make_response(jsonify({"message": "Feedback deleted successfully"}), 200)
    except ValueError:
        return make_response(jsonify({"error": "Invalid feedback index"}), 400)


@app.route('/api/v1.0/courses', methods=['GET'])
def get_courses():
    courses = courses_collection.find({})

    course_list = [json.loads(json_util.dumps(course)) for course in courses]
    return jsonify(course_list), 200


@app.route('/api/v1.0/courses/<course_id>', methods=['GET'])
def get_course(course_id):
    course = courses_collection.find_one({'_id': ObjectId(course_id)})
    if course:
        return jsonify(json.loads(json_util.dumps(course))), 200
    else:
        return jsonify({'message': 'Course not found'}), 404


@app.route('/api/v1.0/courses/search', methods=['GET'])
def search_courses():
    query = request.args.get('query')

    if query:
        courses = courses_collection.find({'$or': [
            {'name': {'$regex': query, '$options': 'i'}},
            {'code': {'$regex': query, '$options': 'i'}},
            {'department': {'$regex': query, '$options': 'i'}},
            {'level': {'$regex': query, '$options': 'i'}},
            {'lecturer': {'$regex': query, '$options': 'i'}},
            {'description': {'$regex': query, '$options': 'i'}}
        ]})

        course_list = []
        for course in courses:
            course['_id'] = str(course['_id'])
            course_list.append(course)

        return jsonify(course_list), 200
    else:
        return jsonify({'message': 'Please provide a search query'}), 400


@app.route('/api/v1.0/courses', methods=['POST'])
# @admin_required
def create_course():
    course_data = request.get_json()
    if course_data:
        name = course_data.get('name')
        code = course_data.get('code')
        department = course_data.get('department')
        level = course_data.get('level')
        credits = course_data.get('credits')
        duration = course_data.get('duration')
        lecturer = course_data.get('lecturer')
        description = course_data.get('description')
        campus = course_data.get('campus')

        if name and code and department and level and lecturer and description and campus:
            new_course = {
                'name': name,
                'code': code,
                'department': department,
                'level': level,
                'credits': credits,
                'duration': duration,
                'lecturer': lecturer,
                'description': description,
                'campus': campus
            }
            course_id = courses_collection.insert_one(new_course).inserted_id
            return jsonify({'message': 'Course created successfully', 'course_id': str(course_id)}), 201, {'Content-Type': 'application/json'}
        else:
            return jsonify({'message': 'Name, code, department, level, lecturer, description, and campus are required'}), 400, {'Content-Type': 'application/json'}
    else:
        return jsonify({'message': 'Course data not provided'}), 400, {'Content-Type': 'application/json'}
    

@app.route('/api/v1.0/courses/<course_id>', methods=['PUT'])
# @admin_required
def update_course(course_id):
    course_data = request.get_json()
    if course_data:
        name = course_data.get('name')
        code = course_data.get('code')
        department = course_data.get('department')
        level = course_data.get('level')
        credits = course_data.get('credits')
        duration = course_data.get('duration')
        lecturer = course_data.get('lecturer')
        description = course_data.get('description')
        campus = course_data.get('campus')

        if name and code and department and level and lecturer and description and campus:
            update_data = {
                'name': name,
                'code': code,
                'department': department,
                'level': level,
                'credits': credits,
                'duration': duration,
                'lecturer': lecturer,
                'description': description,
                'campus': campus
            }
            update_result = courses_collection.update_one(
                {'_id': ObjectId(course_id)},
                {'$set': update_data}
            )
            if update_result.modified_count > 0:
                return jsonify({'message': 'Course updated successfully'}), 200, {'Content-Type': 'application/json'}
            else:
                return jsonify({'message': 'Course not found'}), 404, {'Content-Type': 'application/json'}
        else:
            return jsonify({'message': 'Name, code, department, level, lecturer, description, and campus are required'}), 400, {'Content-Type': 'application/json'}
    else:
        return jsonify({'message': 'Course data not provided'}), 400, {'Content-Type': 'application/json'}


@app.route('/api/v1.0/courses/<course_id>', methods=['DELETE'])
# @admin_required
def delete_course(course_id):
    delete_result = courses_collection.delete_one({'_id': ObjectId(course_id)})
    if delete_result.deleted_count > 0:
        return jsonify({'message': 'Course deleted successfully'}), 200, {'Content-Type': 'application/json'}
    else:
        return jsonify({'message': 'Course not found'}), 404, {'Content-Type': 'application/json'}


@app.route('/api/v1.0/campuses', methods=['GET'])
def get_campuses():
    campuses = campuses_collection.find({})

    campus_list = [json.loads(json_util.dumps(campus)) for campus in campuses]
    return jsonify(campus_list), 200


@app.route('/api/v1.0/campuses/<campus_id>', methods=['GET'])
def get_campus(campus_id):
    campus = campuses_collection.find_one({'_id': ObjectId(campus_id)})
    if campus:
        campus['_id'] = str(campus['_id'])
        return jsonify(campus), 200
    else:
        return jsonify({'message': 'Campus not found'}), 404


@app.route('/api/v1.0/campuses', methods=['POST'])
# @admin_required
def create_campus():
    data = request.form.to_dict()

    int_fields = ['established_year', 'undergraduate_population', 'graduate_population']
    for field in int_fields:
        if field in data and data[field].isdigit():
            data[field] = int(data[field])
        else:
            return jsonify({'message': f'Invalid value for field {field}'}), 400

    array_fields = ['sports_facilities', 'student_clubs']
    for field in array_fields:
        if field in data:
            data[field] = data[field].split(',') 

    bool_fields = ['library', 'cafeteria', 'dormitories']
    for field in bool_fields:
        if field in data:
            data[field] = data[field].lower() in ['true', 'yes', '1']

    required_fields = ['name', 'location', 'established_year', 'undergraduate_population', 'graduate_population', 'faculties', 'sports_facilities', 'student_clubs', 'library', 'cafeteria', 'dormitories']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing field: {field}'}), 400

    try:
        campus_id = campuses_collection.insert_one(data).inserted_id
        return jsonify({'message': 'Campus created successfully', 'campus_id': str(campus_id)}), 201
    except Exception as e:
        return jsonify({'message': f'Error creating campus: {str(e)}'}), 500


@app.route('/api/v1.0/campuses/<campus_id>', methods=['PUT'])
# @admin_required
def update_campus(campus_id):
    name = request.form.get('name')
    location = request.form.get('location')

    if name and location:
        update_data = {
            'name': name,
            'location': location
        }
        update_result = campuses_collection.update_one(
            {'_id': ObjectId(campus_id)},
            {'$set': update_data}
        )
        if update_result.modified_count > 0:
            return jsonify({'message': 'Campus updated successfully'}), 200, {'Content-Type': 'application/json'}
        else:
            return jsonify({'message': 'Campus not found'}), 404, {'Content-Type': 'application/json'}
    else:
        return jsonify({'message': 'Name and location are required'}), 400, {'Content-Type': 'application/json'}


@app.route('/api/v1.0/campuses/<campus_id>', methods=['DELETE'])
# @admin_required
def delete_campus(campus_id):
    delete_result = campuses_collection.delete_one({'_id': ObjectId(campus_id)})
    if delete_result.deleted_count > 0:
        return jsonify({'message': 'Campus deleted successfully'}), 200, {'Content-Type': 'application/json'}
    else:
        return jsonify({'message': 'Campus not found'}), 404, {'Content-Type': 'application/json'}


if __name__ == '__main__':
    app.run(debug=True)