from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import json
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'

# File paths for data storage
USERS_FILE = 'data/users.json'
RECIPES_FILE = 'data/recipes.json'

def load_recipes():
    try:
        with open(RECIPES_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def load_users():
    try:
        with open(USERS_FILE, 'r') as f:
            users = json.load(f)
            # Ensure all users have the required data structure
            for username in users:
                if 'ingredients' not in users[username]:
                    users[username]['ingredients'] = []
                if 'nutrition_log' not in users[username]:
                    users[username]['nutrition_log'] = []
                if 'meal_plans' not in users[username]:
                    users[username]['meal_plans'] = {}
                if 'diet_preferences' not in users[username]:
                    users[username]['diet_preferences'] = {
                        'diet_type': 'balanced',
                        'calorie_target': 2000,
                        'allergies': []
                    }
            return users
    except FileNotFoundError:
        return {}

def save_users(users):
    os.makedirs('data', exist_ok=True)
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)

# Load initial data
users = load_users()
recipes_data = load_recipes()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        # Simple authentication
        if username in users and users[username]['password'] == password:
            session['user'] = username
            session['login_time'] = datetime.now().isoformat()
            # Update last login time
            users[username]['last_login'] = session['login_time']
            save_users(users)
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Invalid credentials'})
    
    return render_template('login.html')

@app.route('/signup', methods=['POST'])
def signup():
    username = request.form.get('username')
    password = request.form.get('password')
    
    if username in users:
        return jsonify({'success': False, 'error': 'Username already exists'})
    
    if len(username) < 3:
        return jsonify({'success': False, 'error': 'Username must be at least 3 characters'})
    
    if len(password) < 6:
        return jsonify({'success': False, 'error': 'Password must be at least 6 characters'})
    
    # Create new user with empty data structures
    users[username] = {
        'password': password,
        'created_at': datetime.now().isoformat(),
        'last_login': datetime.now().isoformat(),
        'ingredients': [],
        'nutrition_log': [],
        'meal_plans': {},
        'diet_preferences': {
            'diet_type': 'balanced',
            'calorie_target': 2000,
            'allergies': []
        }
    }
    
    save_users(users)
    session['user'] = username
    session['login_time'] = datetime.now().isoformat()
    return jsonify({'success': True})

@app.route('/logout')
def logout():
    # Update last activity before logging out
    if 'user' in session:
        username = session['user']
        if username in users:
            users[username]['last_login'] = session.get('login_time')
            save_users(users)
    
    session.pop('user', None)
    session.pop('login_time', None)
    return redirect(url_for('index'))

@app.route('/recipes')
def recipes():
    if 'user' not in session:
        return redirect(url_for('login'))
    return render_template('recipes.html')

@app.route('/api/recipes')
def api_recipes():
    # Filter recipes based on query parameters
    diet = request.args.get('diet', 'all')
    max_time = request.args.get('max_time', 'all')
    difficulty = request.args.get('difficulty', 'all')
    search = request.args.get('search', '')
    meal_type = request.args.get('meal_type', 'all')
    
    filtered_recipes = recipes_data
    
    if diet != 'all':
        filtered_recipes = [r for r in filtered_recipes if r.get('diet', '') == diet]
    
    if max_time != 'all':
        filtered_recipes = [r for r in filtered_recipes if r.get('time', 0) <= int(max_time)]
    
    if difficulty != 'all':
        filtered_recipes = [r for r in filtered_recipes if r.get('difficulty', '') == difficulty]
    
    if meal_type != 'all':
        filtered_recipes = [r for r in filtered_recipes if r.get('meal_type', '') == meal_type]
    
    if search:
        filtered_recipes = [r for r in filtered_recipes if search.lower() in r['name'].lower() or 
                           any(search.lower() in ing.lower() for ing in r.get('ingredients', []))]
    
    return jsonify(filtered_recipes)

@app.route('/api/recipe/<int:recipe_id>')
def api_recipe(recipe_id):
    recipe = next((r for r in recipes_data if r['id'] == recipe_id), None)
    if recipe:
        return jsonify(recipe)
    return jsonify({'error': 'Recipe not found'}), 404

@app.route('/ingredients')
def ingredients():
    if 'user' not in session:
        return redirect(url_for('login'))
    return render_template('ingredients.html')

@app.route('/api/ingredients', methods=['GET', 'POST'])
def api_ingredients():
    if 'user' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    username = session['user']
    
    if request.method == 'POST':
        ingredient = request.json
        ingredient['id'] = len(users[username]['ingredients']) + 1
        ingredient['added'] = datetime.now().isoformat()
        
        users[username]['ingredients'].append(ingredient)
        save_users(users)
        return jsonify({'success': True, 'ingredient': ingredient})
    
    # GET request
    return jsonify(users[username]['ingredients'])

@app.route('/api/ingredients/<int:ingredient_id>', methods=['DELETE'])
def delete_ingredient(ingredient_id):
    if 'user' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    username = session['user']
    
    if username in users:
        users[username]['ingredients'] = [
            ing for ing in users[username]['ingredients'] 
            if ing.get('id') != ingredient_id
        ]
        save_users(users)
        return jsonify({'success': True})
    
    return jsonify({'error': 'Ingredient not found'}), 404

@app.route('/api/nutrition', methods=['GET', 'POST'])
def api_nutrition():
    if 'user' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    username = session['user']
    
    if request.method == 'POST':
        food_entry = request.json
        food_entry['id'] = len(users[username].get('nutrition_log', [])) + 1
        food_entry['timestamp'] = datetime.now().isoformat()
        
        if 'nutrition_log' not in users[username]:
            users[username]['nutrition_log'] = []
        
        users[username]['nutrition_log'].append(food_entry)
        save_users(users)
        return jsonify({'success': True, 'entry': food_entry})
    
    # GET request - return nutrition log and summary
    nutrition_log = users[username].get('nutrition_log', [])
    
    # Calculate daily totals from meal planner
    today_totals = calculate_today_totals_from_planner(username)
    
    # Calculate percentages for progress circles
    calorie_target = users[username].get('diet_preferences', {}).get('calorie_target', 2000)
    protein_target = 100   # Default target
    carb_target = 300      # Default target
    fat_target = 67        # Default target
    
    percentages = {
        'calories': min(100, (today_totals['calories'] / calorie_target) * 100) if calorie_target > 0 else 0,
        'protein': min(100, (today_totals['protein'] / protein_target) * 100) if protein_target > 0 else 0,
        'carbs': min(100, (today_totals['carbs'] / carb_target) * 100) if carb_target > 0 else 0,
        'fat': min(100, (today_totals['fat'] / fat_target) * 100) if fat_target > 0 else 0
    }
    
    return jsonify({
        'log': nutrition_log,
        'totals': today_totals,
        'percentages': percentages,
        'targets': {
            'calories': calorie_target,
            'protein': protein_target,
            'carbs': carb_target,
            'fat': fat_target
        }
    })

def calculate_today_totals_from_planner(username):
    """Calculate today's nutrition totals from meal planner data"""
    today = datetime.now()
    today_day_index = get_today_day_index()
    
    # Get meal plans from user data
    user_meal_plans = users[username].get('meal_plans', {})
    
    current_week_key = get_current_week_key()
    current_plan = user_meal_plans.get(current_week_key, {})
    
    today_totals = {
        'calories': 0,
        'protein': 0,
        'carbs': 0,
        'fat': 0
    }
    
    # Sum all meals for today from planner
    for key, meal_data in current_plan.items():
        if '_' in key:
            day_index = int(key.split('_')[0])
            if day_index == today_day_index:
                today_totals['calories'] += meal_data.get('calories', 0)
                today_totals['protein'] += meal_data.get('protein', 0)
                today_totals['carbs'] += meal_data.get('carbs', 0)
                today_totals['fat'] += meal_data.get('fat', 0)
    
    return today_totals

def get_today_day_index():
    today = datetime.now()
    start_of_week = get_start_of_week(today)
    diff_days = (today - start_of_week).days
    return diff_days

def get_current_week_key():
    today = datetime.now()
    start_of_week = get_start_of_week(today)
    return start_of_week.strftime('%Y-%m-%d')

def get_start_of_week(date):
    start = date.replace(hour=0, minute=0, second=0, microsecond=0)
    day = start.weekday()  # Monday is 0, Sunday is 6
    diff = start.day - day
    return start.replace(day=diff)

@app.route('/api/meal-plans', methods=['GET', 'POST'])
def api_meal_plans():
    if 'user' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    username = session['user']
    
    if request.method == 'POST':
        data = request.json
        week_key = data.get('weekKey')
        plan = data.get('plan')
        
        if week_key and plan:
            # Save meal plan to user data
            if 'meal_plans' not in users[username]:
                users[username]['meal_plans'] = {}
            
            users[username]['meal_plans'][week_key] = plan
            save_users(users)
            return jsonify({'success': True, 'message': 'Meal plan saved'})
        else:
            return jsonify({'error': 'Invalid data'}), 400
    
    # GET request - return all meal plans for the user
    return jsonify(users[username].get('meal_plans', {}))

@app.route('/api/meal-plans/<week_key>')
def api_meal_plan(week_key):
    if 'user' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    username = session['user']
    meal_plans = users[username].get('meal_plans', {})
    
    if week_key in meal_plans:
        return jsonify(meal_plans[week_key])
    else:
        return jsonify({})

@app.route('/api/nutrition/<int:entry_id>', methods=['DELETE'])
def delete_nutrition_entry(entry_id):
    if 'user' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    username = session['user']
    
    if username in users and 'nutrition_log' in users[username]:
        users[username]['nutrition_log'] = [
            entry for entry in users[username]['nutrition_log'] 
            if entry.get('id') != entry_id
        ]
        save_users(users)
        return jsonify({'success': True})
    
    return jsonify({'error': 'Entry not found'}), 404

@app.route('/api/user/profile')
def get_user_profile():
    if 'user' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    username = session['user']
    if username in users:
        user_data = users[username].copy()
        # Don't send password to frontend
        if 'password' in user_data:
            del user_data['password']
        
        # Add statistics
        user_data['statistics'] = {
            'ingredient_count': len(user_data.get('ingredients', [])),
            'nutrition_entries': len(user_data.get('nutrition_log', [])),
            'meal_plans_count': len(user_data.get('meal_plans', {})),
            'account_age_days': calculate_account_age(user_data.get('created_at'))
        }
        
        return jsonify(user_data)
    
    return jsonify({'error': 'User not found'}), 404

def calculate_account_age(created_at):
    if not created_at:
        return 0
    try:
        created = datetime.fromisoformat(created_at)
        now = datetime.now()
        return (now - created).days
    except:
        return 0

@app.route('/meal-planner')
def meal_planner():
    if 'user' not in session:
        return redirect(url_for('login'))
    return render_template('meal-planner.html')

@app.route('/nutrition')
def nutrition():
    if 'user' not in session:
        return redirect(url_for('login'))
    return render_template('nutrition.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/terms')
def terms():
    return render_template('terms.html')

@app.route('/privacy-policy')
def privacy_policy():
    return render_template('privacy-policy.html')

if __name__ == '__main__':
    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    
    # Ensure users file exists
    if not os.path.exists(USERS_FILE):
        save_users({})
    
    print("Server starting...")
    print(f"Loaded {len(users)} users from storage")
    print(f"Loaded {len(recipes_data)} recipes from storage")
    app.run(debug=True)