document.addEventListener('DOMContentLoaded', function() {
    const weekGrid = document.getElementById('weekGrid');
    const generatePlanBtn = document.getElementById('generatePlan');
    const prevWeekBtn = document.getElementById('prevWeek');
    const nextWeekBtn = document.getElementById('nextWeek');
    const currentWeekSpan = document.getElementById('currentWeek');
    const calorieTargetInput = document.getElementById('calorieTarget');
    
    let currentDate = new Date();
    let currentWeekKey = getWeekKey(currentDate);
    
    // Initialize week grid
    generateWeekGrid();
    loadMealPlan();

    // Event listeners
    generatePlanBtn.addEventListener('click', generateMealPlan);
    prevWeekBtn.addEventListener('click', showPreviousWeek);
    nextWeekBtn.addEventListener('click', showNextWeek);
    calorieTargetInput.addEventListener('change', saveDietPreferences);
    
    // Save diet preferences when changed
    document.querySelectorAll('input[name="diet"]').forEach(radio => {
        radio.addEventListener('change', saveDietPreferences);
    });

    function getWeekKey(date) {
        const startOfWeek = getStartOfWeek(date);
        return startOfWeek.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
    
    function generateWeekGrid() {
        weekGrid.innerHTML = '';
        
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const startOfWeek = getStartOfWeek(currentDate);
        
        currentWeekKey = getWeekKey(currentDate);
        currentWeekSpan.textContent = `Week of ${formatDate(startOfWeek)}`;
        
        days.forEach((day, index) => {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + index);
            
            const dayColumn = document.createElement('div');
            dayColumn.className = 'day-column';
            dayColumn.innerHTML = `
                <div class="day-header">
                    <div class="day-name">${day}</div>
                    <div class="day-date">${formatDate(dayDate)}</div>
                    <div class="day-nutrition" style="font-size: 0.7rem; color: #666; margin-top: 0.25rem;">
                        <div>Calories: <span class="day-calories">0</span></div>
                        <div>Protein: <span class="day-protein">0g</span></div>
                        <div>Carbs: <span class="day-carbs">0g</span></div>
                        <div>Fat: <span class="day-fat">0g</span></div>
                    </div>
                </div>
                <div class="day-meals">
                    <div class="meal-slot breakfast" data-day="${index}" data-meal="breakfast">
                        <h4>Breakfast</h4>
                        <div class="meal-content"></div>
                        <div class="meal-actions" style="display: none; margin-top: 0.5rem;">
                            <button class="btn-remove-meal" style="font-size: 0.8rem; background: #e74c3c; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-times"></i> Remove
                            </button>
                        </div>
                    </div>
                    <div class="meal-slot lunch" data-day="${index}" data-meal="lunch">
                        <h4>Lunch</h4>
                        <div class="meal-content"></div>
                        <div class="meal-actions" style="display: none; margin-top: 0.5rem;">
                            <button class="btn-remove-meal" style="font-size: 0.8rem; background: #e74c3c; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-times"></i> Remove
                            </button>
                        </div>
                    </div>
                    <div class="meal-slot dinner" data-day="${index}" data-meal="dinner">
                        <h4>Dinner</h4>
                        <div class="meal-content"></div>
                        <div class="meal-actions" style="display: none; margin-top: 0.5rem;">
                            <button class="btn-remove-meal" style="font-size: 0.8rem; background: #e74c3c; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-times"></i> Remove
                            </button>
                        </div>
                    </div>
                    <div class="meal-slot dessert" data-day="${index}" data-meal="dessert">
                        <h4>Dessert</h4>
                        <div class="meal-content"></div>
                        <div class="meal-actions" style="display: none; margin-top: 0.5rem;">
                            <button class="btn-remove-meal" style="font-size: 0.8rem; background: #e74c3c; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-times"></i> Remove
                            </button>
                        </div>
                    </div>
                </div>
            `;
            weekGrid.appendChild(dayColumn);
        });
        
        // Add Clear All button
        addClearAllButton();
        
        // Add click listeners to meal slots
        document.querySelectorAll('.meal-slot').forEach(slot => {
            slot.addEventListener('click', function(e) {
                if (!e.target.classList.contains('btn-remove-meal') && 
                    !e.target.classList.contains('meal-checkbox') &&
                    !e.target.closest('.meal-selector')) {
                    openRecipeSearchModal(this);
                }
            });
        });
        
        // Add listeners to remove buttons
        document.querySelectorAll('.btn-remove-meal').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const mealSlot = this.closest('.meal-slot');
                removeMeal(mealSlot);
            });
        });
        
        updateAllNutritionData();
    }
    
    function addClearAllButton() {
        // Remove existing clear all section if it exists
        const existingClearAll = document.querySelector('.clear-all-section');
        if (existingClearAll) {
            existingClearAll.remove();
        }

        const clearAllSection = document.createElement('div');
        clearAllSection.className = 'clear-all-section';
        clearAllSection.style.cssText = `
            grid-column: 1 / -1;
            background: white;
            padding: 1.5rem;
            border-top: 1px solid var(--border);
            text-align: center;
        `;
        
        clearAllSection.innerHTML = `
            <button class="btn btn-secondary" id="clearAllBtn" style="background: #e74c3c; color: white; border: none;">
                <i class="fas fa-trash"></i> Clear All Meals
            </button>
            <p style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">
                Remove all meals from this week's plan
            </p>
        `;
        
        weekGrid.appendChild(clearAllSection);
        
        // Add event listener for Clear All button
        document.getElementById('clearAllBtn').addEventListener('click', clearAllMeals);
    }

    // Add this function to calculate and sync nutrition
    function calculateAndSyncNutrition() {
        console.log('=== MANUAL NUTRITION SYNC TRIGGERED ===');

        // Update local nutrition display first
        updateAllNutritionData();

        // Force sync with nutrition tab
        syncNutritionData();

        // Show notification
        showNotification('Nutrition data calculated and synced!', 'success');

        // Debug: Check what's being sent to nutrition
        const mealPlans = JSON.parse(localStorage.getItem('mealPlans') || '{}');
        const currentWeekKey = getCurrentWeekKey();
        console.log('Current week key:', currentWeekKey);
        console.log('Current plan data:', mealPlans[currentWeekKey]);
    }
    
    function clearAllMeals() {
        if (confirm('Are you sure you want to remove all meals from this week\'s plan? This action cannot be undone.')) {
            // Clear from localStorage
            const mealPlans = JSON.parse(localStorage.getItem('mealPlans') || '{}');
            delete mealPlans[currentWeekKey];
            localStorage.setItem('mealPlans', JSON.stringify(mealPlans));
            
            // Clear from backend
            saveMealPlanToBackend({});
            
            // Clear UI
            clearMealSlots();
            
            // Update nutrition data (will reset to zero)
            updateAllNutritionData();
            
            showNotification('All meals cleared from this week\'s plan!', 'success');
        }
    }
    
    function getStartOfWeek(date) {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(start.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek;
    }
    
    function formatDate(date) {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    function showPreviousWeek() {
        currentDate.setDate(currentDate.getDate() - 7);
        generateWeekGrid();
        loadMealPlan();
    }
    
    function showNextWeek() {
        currentDate.setDate(currentDate.getDate() + 7);
        generateWeekGrid();
        loadMealPlan();
    }
    
    function saveDietPreferences() {
        const diet = document.querySelector('input[name="diet"]:checked').value;
        const calorieTarget = document.getElementById('calorieTarget').value;
        
        const preferences = { diet, calorieTarget: parseInt(calorieTarget) };
        localStorage.setItem('dietPreferences', JSON.stringify(preferences));
        
        // Update all nutrition data when preferences change
        updateAllNutritionData();
    }
    
    function loadDietPreferences() {
        const preferences = JSON.parse(localStorage.getItem('dietPreferences') || '{}');
        if (preferences.diet) {
            document.querySelector(`input[name="diet"][value="${preferences.diet}"]`).checked = true;
        }
        if (preferences.calorieTarget) {
            document.getElementById('calorieTarget').value = preferences.calorieTarget;
        }
    }
    
    function generateMealPlan() {
        const diet = document.querySelector('input[name="diet"]:checked').value;
        const calorieTarget = document.getElementById('calorieTarget').value;
        
        // Show loading state
        generatePlanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        generatePlanBtn.disabled = true;
        
        // Fetch recipes based on diet preference
        fetch(`/api/recipes?diet=${diet}`)
            .then(response => response.json())
            .then(recipes => {
                const samplePlan = generateSampleMealPlan(recipes, diet, calorieTarget);
                applyMealPlan(samplePlan);
                saveMealPlanToStorage(samplePlan);
                
                generatePlanBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Plan';
                generatePlanBtn.disabled = false;
                
                showNotification(`Generated meal plan for the week!`, 'success');
            })
            .catch(error => {
                console.error('Error generating meal plan:', error);
                generatePlanBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Plan';
                generatePlanBtn.disabled = false;
            });
    }
    
    function generateSampleMealPlan(recipes, diet, calorieTarget) {
        const plan = {};
        
        // Group recipes by meal type
        const recipesByMealType = {
            breakfast: recipes.filter(r => r.meal_type === 'breakfast'),
            lunch: recipes.filter(r => r.meal_type === 'lunch'),
            dinner: recipes.filter(r => r.meal_type === 'dinner'),
            dessert: recipes.filter(r => r.meal_type === 'dessert')
        };
        
        for (let day = 0; day < 7; day++) {
            const meals = ['breakfast', 'lunch', 'dinner', 'dessert'];
            meals.forEach(meal => {
                // Get available recipes for this meal type
                let availableRecipes = recipesByMealType[meal];
                
                // If no specific meal type recipes, use any recipe
                if (availableRecipes.length === 0) {
                    availableRecipes = recipes;
                }
                
                if (availableRecipes.length > 0) {
                    const randomRecipe = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
                    plan[`${day}_${meal}`] = ensureMealDataStructure({
                        name: randomRecipe.name,
                        calories: randomRecipe.nutrition.calories,
                        protein: randomRecipe.nutrition.protein,
                        carbs: randomRecipe.nutrition.carbs,
                        fat: randomRecipe.nutrition.fat,
                        mealTime: meal.charAt(0).toUpperCase() + meal.slice(1),
                        weekKey: currentWeekKey,
                        dayIndex: day,
                        mealType: meal,
                        recipeId: randomRecipe.id,
                        isSelected: true // Ensure meals are selected by default
                    });
                }
            });
        }
        
        return plan;
    }
    
    function applyMealPlan(plan) {
        Object.keys(plan).forEach(key => {
            const [day, meal] = key.split('_');
            const mealSlot = document.querySelector(`[data-day="${day}"][data-meal="${meal}"]`);
            if (mealSlot) {
                const mealData = plan[key];
                updateMealSlot(mealSlot, mealData);
            }
        });
        updateAllNutritionData();
    }
    
    function updateMealSlot(mealSlot, mealData) {
        const mealContent = mealSlot.querySelector('.meal-content');
        const isSelected = mealData.isSelected !== false;

        mealContent.innerHTML = `
            <label class="meal-selector" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                <input type="checkbox" class="meal-checkbox" ${isSelected ? 'checked' : ''}>
                <span style="font-size: 0.8rem; color: #666;">Include in nutrition</span>
            </label>
            <div class="meal-nutrition">
                <strong>${mealData.name}</strong>
                <div style="font-size: 0.8rem; color: #666; margin-top: 0.25rem;">
                    ${mealData.calories} cal • ${mealData.protein}g protein • ${mealData.carbs}g carbs • ${mealData.fat}g fat
                </div>
            </div>
        `;
        mealSlot.classList.remove('empty');
        mealSlot.classList.add('has-meal');

        // Show action buttons
        const actions = mealSlot.querySelector('.meal-actions');
        if (actions) {
            actions.style.display = 'flex';
        }

        // Store meal data
        mealSlot.setAttribute('data-meal-data', JSON.stringify(mealData));

        // Add event listener for checkbox
        const dayIndex = mealSlot.getAttribute('data-day');
        const mealType = mealSlot.getAttribute('data-meal');
        const checkbox = mealContent.querySelector('.meal-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', function(e) {
                e.stopPropagation();
                updateMealSelection(dayIndex, mealType, this.checked);
            });
        }
    }
    
    function saveMealPlanToStorage(plan) {
        const mealPlans = JSON.parse(localStorage.getItem('mealPlans') || '{}');
        mealPlans[currentWeekKey] = plan;
        localStorage.setItem('mealPlans', JSON.stringify(mealPlans));
        
        // Also save to user data in the backend
        saveMealPlanToBackend(plan);
        
        // Sync with nutrition data
        syncNutritionData();
    }
    
    function saveMealPlanToBackend(plan) {
        // Save meal plan to backend via API
        fetch('/api/meal-plans', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                weekKey: currentWeekKey,
                plan: plan
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Meal plan saved to backend:', data);
        })
        .catch(error => {
            console.error('Error saving meal plan to backend:', error);
        });
    }
    
    function initializeEmptyMealPlan() {
        const mealPlans = JSON.parse(localStorage.getItem('mealPlans') || '{}');
        const currentWeekKey = getCurrentWeekKey();
        
        // Only initialize if no plan exists for current week
        if (!mealPlans[currentWeekKey]) {
            mealPlans[currentWeekKey] = {};
            localStorage.setItem('mealPlans', JSON.stringify(mealPlans));
            console.log('Initialized empty meal plan for week:', currentWeekKey);
        }
        
        return mealPlans;
    }
    
    function loadMealPlan() {
        // Initialize empty plan first
        initializeEmptyMealPlan();
        
        const mealPlans = JSON.parse(localStorage.getItem('mealPlans') || '{}');
        const plan = mealPlans[currentWeekKey] || {};
        
        if (Object.keys(plan).length > 0) {
            applyMealPlan(plan);
        } else {
            clearMealSlots();
        }
        updateAllNutritionData();
    }
    
    function clearMealSlots() {
        document.querySelectorAll('.meal-slot').forEach(slot => {
            const mealContent = slot.querySelector('.meal-content');
            mealContent.innerHTML = '<div style="color: #999; font-style: italic;">Click to add meal</div>';
            slot.classList.add('empty');
            slot.classList.remove('has-meal');
            const actions = slot.querySelector('.meal-actions');
            if (actions) {
                actions.style.display = 'none';
            }
            slot.removeAttribute('data-meal-data');
        });
    }
    
    function openRecipeSearchModal(mealSlot) {
        const day = mealSlot.getAttribute('data-day');
        const meal = mealSlot.getAttribute('data-meal');
        
        const modalHTML = `
            <div class="modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:2000;">
                <div style="background:white;padding:2rem;border-radius:8px;max-width:600px;width:90%;max-height:80vh;overflow-y:auto;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                        <h3>Select a Recipe for ${meal.charAt(0).toUpperCase() + meal.slice(1)}</h3>
                        <button class="close-modal" style="background:none;border:none;font-size:1.5rem;cursor:pointer;">&times;</button>
                    </div>
                    
                    <div class="search-box" style="margin-bottom:1rem;">
                        <input type="text" id="recipeSearchInput" class="form-control" placeholder="Search recipes..." style="flex:1;">
                        <button class="btn btn-primary" id="searchRecipesBtn" style="margin-left:0.5rem;">
                            <i class="fas fa-search"></i> Search
                        </button>
                    </div>
                    
                    <div class="meal-options" id="recipeOptions">
                        <div style="text-align:center;padding:2rem;color:#666;">
                            <i class="fas fa-spinner fa-spin"></i> Loading recipes...
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Load recipes
        loadRecipesForModal(day, meal, mealSlot);
        
        // Search functionality
        document.getElementById('searchRecipesBtn').addEventListener('click', function() {
            loadRecipesForModal(day, meal, mealSlot);
        });
        
        document.getElementById('recipeSearchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loadRecipesForModal(day, meal, mealSlot);
            }
        });
        
        document.querySelector('.close-modal').addEventListener('click', function() {
            document.querySelector('.modal').remove();
        });
        
        document.querySelector('.modal').addEventListener('click', function(e) {
            if (e.target === this) {
                this.remove();
            }
        });
    }
    
    function loadRecipesForModal(day, meal, mealSlot) {
        const searchTerm = document.getElementById('recipeSearchInput').value;
        const mealType = meal;
        
        let url = '/api/recipes?';
        if (mealType && mealType !== 'all') {
            url += `meal_type=${mealType}&`;
        }
        if (searchTerm) {
            url += `search=${encodeURIComponent(searchTerm)}&`;
        }
        
        fetch(url)
            .then(response => response.json())
            .then(recipes => {
                displayRecipeOptions(recipes, day, meal, mealSlot);
            })
            .catch(error => {
                console.error('Error loading recipes:', error);
                document.getElementById('recipeOptions').innerHTML = '<div style="text-align:center;padding:2rem;color:#666;">Error loading recipes</div>';
            });
    }
    
    function displayRecipeOptions(recipes, day, meal, mealSlot) {
        const recipeOptions = document.getElementById('recipeOptions');
        
        if (recipes.length === 0) {
            recipeOptions.innerHTML = '<div style="text-align:center;padding:2rem;color:#666;">No recipes found matching your criteria.</div>';
            return;
        }
        
        recipeOptions.innerHTML = recipes.map(recipe => `
            <div class="meal-option" data-recipe='${JSON.stringify(recipe).replace(/'/g, "&apos;")}'>
                <h4>${recipe.name}</h4>
                <p>${recipe.description}</p>
                <div style="font-size:0.8rem;color:#666;">
                    <span><i class="fas fa-clock"></i> ${recipe.time} min</span> • 
                    <span><i class="fas fa-fire"></i> ${recipe.nutrition.calories} cal</span> • 
                    <span>Protein: ${recipe.nutrition.protein}g</span> • 
                    <span>Carbs: ${recipe.nutrition.carbs}g</span> • 
                    <span>Fat: ${recipe.nutrition.fat}g</span>
                </div>
            </div>
        `).join('');
        
        // Add event listeners to recipe options
        document.querySelectorAll('.meal-option').forEach(option => {
            option.addEventListener('click', function() {
                const recipeData = JSON.parse(this.getAttribute('data-recipe').replace(/&apos;/g, "'"));
                selectRecipeForMeal(recipeData, day, meal, mealSlot);
            });
        });
    }
    
    function selectRecipeForMeal(recipeData, day, meal, mealSlot) {
        const mealData = ensureMealDataStructure({
            name: recipeData.name,
            calories: recipeData.nutrition.calories,
            protein: recipeData.nutrition.protein,
            carbs: recipeData.nutrition.carbs,
            fat: recipeData.nutrition.fat,
            mealTime: meal.charAt(0).toUpperCase() + meal.slice(1),
            weekKey: currentWeekKey,
            dayIndex: parseInt(day),
            mealType: meal,
            recipeId: recipeData.id,
            isSelected: true // Ensure new meals are selected by default
        });
        
        // Save the meal
        const mealPlans = JSON.parse(localStorage.getItem('mealPlans') || '{}');
        if (!mealPlans[currentWeekKey]) {
            mealPlans[currentWeekKey] = {};
        }
        mealPlans[currentWeekKey][`${day}_${meal}`] = mealData;
        localStorage.setItem('mealPlans', JSON.stringify(mealPlans));
        
        // Update UI
        updateMealSlot(mealSlot, mealData);
        
        // Auto-calculate nutrition after adding meal
        calculateAndSyncNutrition();
        
        document.querySelector('.modal').remove();
        showNotification(`Added "${recipeData.name}" to meal plan!`, 'success');
    }

    // Function to update meal selection
    function updateMealSelection(dayIndex, mealType, isSelected) {
        const currentWeekKey = getCurrentWeekKey();
        const mealPlans = JSON.parse(localStorage.getItem('mealPlans') || '{}');
        const mealKey = `${dayIndex}_${mealType}`;

        if (mealPlans[currentWeekKey] && mealPlans[currentWeekKey][mealKey]) {
            mealPlans[currentWeekKey][mealKey].isSelected = isSelected;
            localStorage.setItem('mealPlans', JSON.stringify(mealPlans));
            console.log('Meal selection updated:', mealKey, isSelected);

            // Sync with nutrition tab
            syncNutritionData();
            updateAllNutritionData();
        }
    }
    
    function removeMeal(mealSlot) {
        const day = mealSlot.getAttribute('data-day');
        const meal = mealSlot.getAttribute('data-meal');
        const mealDataStr = mealSlot.getAttribute('data-meal-data');
        
        if (mealDataStr) {
            const mealData = JSON.parse(mealDataStr);
            
            // Remove from meal plans storage
            const mealPlans = JSON.parse(localStorage.getItem('mealPlans') || '{}');
            if (mealPlans[currentWeekKey] && mealPlans[currentWeekKey][`${day}_${meal}`]) {
                delete mealPlans[currentWeekKey][`${day}_${meal}`];
                localStorage.setItem('mealPlans', JSON.stringify(mealPlans));
                
                // Also update backend
                saveMealPlanToBackend(mealPlans[currentWeekKey]);
            }
            
            showNotification(`Removed "${mealData.name}" from meal plan`, 'info');
        }
        
        // Clear the slot
        const mealContent = mealSlot.querySelector('.meal-content');
        mealContent.innerHTML = '<div style="color: #999; font-style: italic;">Click to add meal</div>';
        mealSlot.classList.add('empty');
        mealSlot.classList.remove('has-meal');
        const actions = mealSlot.querySelector('.meal-actions');
        if (actions) {
            actions.style.display = 'none';
        }
        mealSlot.removeAttribute('data-meal-data');
        
        updateAllNutritionData();
    }
    
    function updateAllNutritionData() {
        updateDayNutrition();
        updateDailySummary();
        syncNutritionData();
    }
    
    function updateDayNutrition() {
        const mealPlans = JSON.parse(localStorage.getItem('mealPlans') || '{}');
        const currentPlan = mealPlans[currentWeekKey] || {};
        
        console.log('Updating day nutrition for plan:', currentPlan);
        
        // START WITH ZERO VALUES for all days
        const dayNutrition = Array(7).fill().map(() => ({
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        }));
        
        // Only add values if meals actually exist
        Object.keys(currentPlan).forEach(key => {
            const [day, meal] = key.split('_');
            const mealData = currentPlan[key];
            const dayIndex = parseInt(day);
            
            if (dayIndex >= 0 && dayIndex < 7 && mealData) {
                const safeMealData = ensureMealDataStructure(mealData);
                
                // Only add if meal is selected and has valid numbers
                if (safeMealData.isSelected !== false && 
                    (safeMealData.calories > 0 || safeMealData.protein > 0 || safeMealData.carbs > 0 || safeMealData.fat > 0)) {
                    dayNutrition[dayIndex].calories += safeMealData.calories;
                    dayNutrition[dayIndex].protein += safeMealData.protein;
                    dayNutrition[dayIndex].carbs += safeMealData.carbs;
                    dayNutrition[dayIndex].fat += safeMealData.fat;
                    
                    console.log(`Added to day ${dayIndex}: ${safeMealData.name} - ${safeMealData.calories} cal`);
                }
            }
        });
        
        // Update day headers (will show zeros if no meals)
        document.querySelectorAll('.day-column').forEach((column, index) => {
            const nutrition = dayNutrition[index];
            
            const caloriesSpan = column.querySelector('.day-calories');
            const proteinSpan = column.querySelector('.day-protein');
            const carbsSpan = column.querySelector('.day-carbs');
            const fatSpan = column.querySelector('.day-fat');
            
            if (caloriesSpan) caloriesSpan.textContent = nutrition.calories;
            if (proteinSpan) proteinSpan.textContent = `${nutrition.protein}g`;
            if (carbsSpan) carbsSpan.textContent = `${nutrition.carbs}g`;
            if (fatSpan) fatSpan.textContent = `${nutrition.fat}g`;
            
            // Style based on whether there are meals
            const hasMeals = nutrition.calories > 0;
            [caloriesSpan, proteinSpan, carbsSpan, fatSpan].forEach(span => {
                if (span) {
                    span.style.color = hasMeals ? '#e74c3c' : '#666';
                    span.style.fontWeight = hasMeals ? '600' : 'normal';
                }
            });
        });
        
        console.log('Day nutrition updated:', dayNutrition);
        return dayNutrition;
    }
    
    function updateDailySummary() {
        const dayNutrition = updateDayNutrition();
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        days.forEach((day, index) => {
            const nutrition = dayNutrition[index];
            const summaryCard = document.querySelectorAll('.daily-summary-card')[index];
            
            if (summaryCard) {
                const caloriesSpan = summaryCard.querySelector('.daily-calories');
                const proteinSpan = summaryCard.querySelector('.daily-protein');
                const carbsSpan = summaryCard.querySelector('.daily-carbs');
                const fatSpan = summaryCard.querySelector('.daily-fat');
                
                if (caloriesSpan) caloriesSpan.textContent = nutrition.calories;
                if (proteinSpan) proteinSpan.textContent = `${nutrition.protein}g`;
                if (carbsSpan) carbsSpan.textContent = `${nutrition.carbs}g`;
                if (fatSpan) fatSpan.textContent = `${nutrition.fat}g`;
                
                // Style based on whether there are meals
                const hasMeals = nutrition.calories > 0;
                [caloriesSpan, proteinSpan, carbsSpan, fatSpan].forEach(span => {
                    if (span) {
                        span.style.color = hasMeals ? '#e74c3c' : '#666';
                    }
                });
            }
        });
    }
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'warning' ? '#f39c12' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 4px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 400px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Load diet preferences on page load
    loadDietPreferences();
});

// Enhanced global sync function
function syncNutritionData() {
    console.log('=== SYNCING NUTRITION DATA ===');
    
    // Update nutrition page if it's open
    if (typeof window.updateNutritionData === 'function') {
        window.updateNutritionData();
    }
    
    // Force a small delay to ensure DOM updates
    setTimeout(() => {
        console.log('=== NUTRITION DATA SYNC COMPLETED ===');
    }, 500);
}

// Make sync function globally available
window.syncNutritionData = syncNutritionData;

// Data structure validation function
function ensureMealDataStructure(mealData) {
    return {
        name: mealData.name || 'Unknown Meal',
        calories: Number(mealData.calories) || 0,
        protein: Number(mealData.protein) || 0,
        carbs: Number(mealData.carbs) || 0,
        fat: Number(mealData.fat) || 0,
        mealTime: mealData.mealTime || 'Meal',
        planned: true,
        weekKey: mealData.weekKey || getCurrentWeekKey(),
        dayIndex: Number(mealData.dayIndex) || 0,
        mealType: mealData.mealType || 'lunch',
        recipeId: mealData.recipeId || null,
        isSelected: mealData.isSelected !== undefined ? mealData.isSelected : true, // Default to true
        timestamp: mealData.timestamp || new Date().toISOString()
    };
}

// Helper function for current week key
function getCurrentWeekKey() {
    const today = new Date();
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeekDate = new Date(startOfWeek.setDate(diff));
    startOfWeekDate.setHours(0, 0, 0, 0);
    return startOfWeekDate.toISOString().split('T')[0];
}