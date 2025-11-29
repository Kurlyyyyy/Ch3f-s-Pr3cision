document.addEventListener('DOMContentLoaded', function() {
    const breakfastRecipes = document.getElementById('breakfastRecipes');
    const lunchRecipes = document.getElementById('lunchRecipes');
    const dinnerRecipes = document.getElementById('dinnerRecipes');
    const dessertRecipes = document.getElementById('dessertRecipes');
    const searchBtn = document.getElementById('searchBtn');
    const recipeSearch = document.getElementById('recipeSearch');
    const dietFilter = document.getElementById('dietFilter');
    const timeFilter = document.getElementById('timeFilter');
    const mealTypeFilter = document.getElementById('mealTypeFilter');

    // NEW: Recommendation elements
    const ingredientRecommendations = document.getElementById('ingredientRecommendations');
    const recommendedRecipes = document.getElementById('recommendedRecipes');

    // Store all recipes
    let allRecipes = [];

    // NEW: Check for ingredient search from ingredients page
    checkForIngredientSearch();
    
    // Load recipes on page load
    loadRecipes();
    
    // Event listeners for filters
    searchBtn.addEventListener('click', function() {
        loadRecipes();
    });
    
    recipeSearch.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loadRecipes();
        }
    });
    
    dietFilter.addEventListener('change', function() {
        loadRecipes();
    });
    
    timeFilter.addEventListener('change', function() {
        loadRecipes();
    });
    
    mealTypeFilter.addEventListener('change', function() {
        loadRecipes();
    });
    
    // NEW FUNCTION: Check if we came from ingredients page with search
    function checkForIngredientSearch() {
        const ingredientSearch = localStorage.getItem('ingredientSearch');
        const searchTime = localStorage.getItem('ingredientSearchTime');
        const selectedCount = localStorage.getItem('selectedIngredientsCount');
        
        if (ingredientSearch && searchTime) {
            const currentTime = new Date().getTime();
            const searchAge = currentTime - parseInt(searchTime);
            
            // Only auto-search if it's recent (within 5 minutes)
            if (searchAge < 5 * 60 * 1000) {
                // Set the search input with ingredients
                const ingredients = ingredientSearch.split(',');
                const searchQuery = ingredients.join(' ');
                recipeSearch.value = searchQuery;
                
                // Show a notification with selected count
                const countText = selectedCount ? ` (${selectedCount} selected)` : '';
                showNotification(`🔍 Searching recipes with your ingredients${countText}: ${ingredients.join(', ')}`, 'info');
                
                // Clear the stored search after use
                localStorage.removeItem('ingredientSearch');
                localStorage.removeItem('ingredientSearchTime');
                localStorage.removeItem('selectedIngredientsCount');
            } else {
                // Clear expired search
                localStorage.removeItem('ingredientSearch');
                localStorage.removeItem('ingredientSearchTime');
                localStorage.removeItem('selectedIngredientsCount');
            }
        }
    }
    
    // NEW FUNCTION: Load ingredient-based recommendations
    function loadIngredientRecommendations() {
        const userIngredients = getUserIngredients();
        
        if (userIngredients.length === 0) {
            if (ingredientRecommendations) {
                ingredientRecommendations.style.display = 'none';
            }
            return;
        }
        
        const filteredRecipes = filterRecipes(allRecipes);
        const recommendations = getIngredientRecommendations(filteredRecipes, userIngredients);
        displayIngredientRecommendations(recommendations, userIngredients);
    }
    
    // NEW FUNCTION: Get user ingredients from localStorage
    function getUserIngredients() {
        try {
            const userIngredients = localStorage.getItem('userIngredients');
            return userIngredients ? JSON.parse(userIngredients) : [];
        } catch (error) {
            console.error('Error getting user ingredients:', error);
            return [];
        }
    }
    
    // NEW FUNCTION: Get ingredient-based recommendations
    function getIngredientRecommendations(recipes, userIngredients) {
        const recommendations = recipes.map(recipe => {
            const matchStats = calculateIngredientMatch(recipe, userIngredients);
            return {
                ...recipe,
                matchPercentage: matchStats.percentage,
                matchedCount: matchStats.matched,
                missingCount: matchStats.missing
            };
        })
        .filter(recipe => recipe.matchPercentage > 0)
        .sort((a, b) => b.matchPercentage - a.matchPercentage)
        .slice(0, 6); // Top 6 matches
        
        return recommendations;
    }
    
    // NEW FUNCTION: Display ingredient-based recommendations
    function displayIngredientRecommendations(recommendations, userIngredients) {
        if (!ingredientRecommendations || !recommendedRecipes) {
            return;
        }
        
        if (!recommendations || recommendations.length === 0) {
            ingredientRecommendations.style.display = 'none';
            return;
        }
        
        ingredientRecommendations.style.display = 'block';
        recommendedRecipes.innerHTML = '';
        
        recommendations.forEach(recipe => {
            const recipeCard = createRecommendationRecipeCard(recipe, userIngredients);
            recommendedRecipes.appendChild(recipeCard);
        });
    }
    
    // NEW FUNCTION: Create recipe card for recommendations
    function createRecommendationRecipeCard(recipe, userIngredients) {
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card recommendation-card';
        
        const recipeImage = getRecipeImage(recipe);
        const matchStats = calculateIngredientMatch(recipe, userIngredients);
        
        recipeCard.innerHTML = `
            <div class="recipe-card-content">
                <div class="recipe-image-container">
                    <img src="${recipeImage}" alt="${recipe.name}" class="recipe-image" 
                         onerror="this.src='${getDefaultPlaceholderImage()}'">
                    <div class="recommendation-badge">${matchStats.percentage}% Match</div>
                </div>
                <div class="recipe-info">
                    <h3 class="recipe-title">${recipe.name}</h3>
                    <p class="recipe-description">${recipe.description || 'A delicious recipe for your meal plan.'}</p>
                    
                    <!-- Ingredient Match Information -->
                    <div class="ingredient-match-info">
                        <div class="match-stats">
                            <span class="match-stat" style="color: #27ae60;">
                                <i class="fas fa-check-circle"></i> ${matchStats.matched} ingredients you have
                            </span>
                            <span class="match-stat" style="color: #e74c3c;">
                                <i class="fas fa-shopping-cart"></i> ${matchStats.missing} to buy
                            </span>
                        </div>
                    </div>
                    
                    <div class="recipe-meta">
                        <span class="meta-item"><i class="fas fa-clock"></i> ${recipe.time} min</span>
                        <span class="meta-item"><i class="fas fa-fire"></i> ${recipe.nutrition.calories} cal</span>
                        <span class="meta-item difficulty-${recipe.difficulty?.toLowerCase() || 'medium'}">${recipe.difficulty || 'Medium'}</span>
                    </div>
                    <div class="recipe-actions">
                        <button class="btn btn-primary view-recipe" data-id="${recipe.id}">
                            <i class="fas fa-utensils"></i> View Details
                        </button>
                        <button class="btn btn-secondary add-to-planner" data-recipe='${JSON.stringify(recipe).replace(/'/g, "&apos;")}'>
                            <i class="fas fa-plus"></i> Add to Planner
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        recipeCard.querySelector('.view-recipe').addEventListener('click', function() {
            viewRecipe(recipe);
        });
        
        recipeCard.querySelector('.add-to-planner').addEventListener('click', function() {
            const recipeData = JSON.parse(this.getAttribute('data-recipe').replace(/&apos;/g, "'"));
            quickAddToPlanner(recipeData);
        });
        
        return recipeCard;
    }
    
    // NEW FUNCTION: Calculate ingredient match percentage
    function calculateIngredientMatch(recipe, userIngredients) {
        if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
            return { matched: 0, missing: 0, percentage: 0, matchedIngredients: [] };
        }
        
        const userIngredientNames = userIngredients.map(ing => ing.toLowerCase().trim());
        const matchedIngredients = [];
        
        recipe.ingredients.forEach(recipeIngredient => {
            const ingredientName = extractIngredientName(recipeIngredient).toLowerCase();
            
            // Check for matches
            const isMatch = userIngredientNames.some(userIng => {
                return userIng.includes(ingredientName) || 
                       ingredientName.includes(userIng) ||
                       calculateSimilarity(userIng, ingredientName) > 0.6;
            });
            
            if (isMatch) {
                matchedIngredients.push(recipeIngredient);
            }
        });
        
        const totalIngredients = recipe.ingredients.length;
        const matchedCount = matchedIngredients.length;
        const missingCount = totalIngredients - matchedCount;
        const matchPercentage = totalIngredients > 0 ? Math.round((matchedCount / totalIngredients) * 100) : 0;
        
        return {
            matched: matchedCount,
            missing: missingCount,
            percentage: matchPercentage,
            matchedIngredients: matchedIngredients
        };
    }
    
    // NEW FUNCTION: Extract ingredient name from recipe ingredient string
    function extractIngredientName(ingredientString) {
        if (typeof ingredientString !== 'string') return '';
        
        return ingredientString
            .replace(/[0-9½¼¾⅓⅔⅛⅜⅝⅞.,]/g, '')
            .replace(/(cup|tbsp|tsp|oz|lb|kg|g|ml|cl|dl|liter|pound|ounce|teaspoon|tablespoon)s?\b/gi, '')
            .replace(/\b(sliced|chopped|diced|minced|grated|fresh|dried|ground|powdered)\b/gi, '')
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    // NEW FUNCTION: Calculate similarity between two strings (simple version)
    function calculateSimilarity(str1, str2) {
        if (str1.length === 0 || str2.length === 0) return 0;
        
        // Simple containment check
        if (str1.includes(str2) || str2.includes(str1)) return 0.9;
        
        // Levenshtein distance based similarity (simplified)
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        let matches = 0;
        for (let i = 0; i < shorter.length; i++) {
            if (longer.includes(shorter[i])) matches++;
        }
        
        return matches / longer.length;
    }
    
    function loadRecipes() {
        // Load recipes from JSON file
        fetch('/static/assets/recipes.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(recipes => {
                allRecipes = recipes;
                const filteredRecipes = filterRecipes(recipes);
                displayRecipesByCategory(filteredRecipes);
                loadIngredientRecommendations();
            })
            .catch(error => {
                console.error('Error loading recipes from JSON:', error);
                // Fallback: try to load from API if JSON file fails
                loadRecipesFromAPI();
            });
    }
    
    function loadRecipesFromAPI() {
        const params = new URLSearchParams({
            diet: dietFilter.value,
            max_time: timeFilter.value,
            search: recipeSearch.value,
            meal_type: mealTypeFilter.value
        });
        
        fetch(`/api/recipes?${params}`)
            .then(response => response.json())
            .then(recipes => {
                allRecipes = recipes;
                displayRecipesByCategory(recipes);
            })
            .catch(error => {
                console.error('Error loading recipes from API:', error);
            });
    }
    
    function filterRecipes(recipes) {
        const searchTerm = recipeSearch.value.toLowerCase();
        const diet = dietFilter.value;
        const maxTime = timeFilter.value;
        const mealType = mealTypeFilter.value;
        
        return recipes.filter(recipe => {
            // Search filter
            if (searchTerm && !recipe.name.toLowerCase().includes(searchTerm) && 
                !recipe.description.toLowerCase().includes(searchTerm)) {
                return false;
            }
            
            // Diet filter
            if (diet !== 'all' && recipe.diet !== diet) {
                return false;
            }
            
            // Time filter
            if (maxTime !== 'all' && recipe.time > parseInt(maxTime)) {
                return false;
            }
            
            // Meal type filter
            if (mealType !== 'all' && recipe.meal_type !== mealType) {
                return false;
            }
            
            return true;
        });
    }
    
    function displayRecipesByCategory(recipes) {
        // Clear all recipe grids
        breakfastRecipes.innerHTML = '';
        lunchRecipes.innerHTML = '';
        dinnerRecipes.innerHTML = '';
        dessertRecipes.innerHTML = '';
        
        if (recipes.length === 0) {
            const emptyMessage = '<div class="empty-category">No recipes found matching your criteria.</div>';
            breakfastRecipes.innerHTML = emptyMessage;
            lunchRecipes.innerHTML = emptyMessage;
            dinnerRecipes.innerHTML = emptyMessage;
            dessertRecipes.innerHTML = emptyMessage;
            return;
        }
        
        // Categorize recipes by meal type
        const categorizedRecipes = {
            breakfast: [],
            lunch: [],
            dinner: [],
            dessert: []
        };
        
        recipes.forEach(recipe => {
            const mealType = recipe.meal_type || 'lunch'; // Default to lunch if not specified
            if (categorizedRecipes[mealType]) {
                categorizedRecipes[mealType].push(recipe);
            }
        });
        
        // Display recipes in their respective categories
        displayCategoryRecipes('breakfast', categorizedRecipes.breakfast);
        displayCategoryRecipes('lunch', categorizedRecipes.lunch);
        displayCategoryRecipes('dinner', categorizedRecipes.dinner);
        displayCategoryRecipes('dessert', categorizedRecipes.dessert);
    }
    
    function displayCategoryRecipes(category, recipes) {
        const container = document.getElementById(`${category}Recipes`);
        
        if (recipes.length === 0) {
            container.innerHTML = `<div class="empty-category">No ${category} recipes found.</div>`;
            return;
        }
        
        recipes.forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card';
            
            // Get recipe image
            const recipeImage = getRecipeImage(recipe);
            
            recipeCard.innerHTML = `
                <div class="recipe-card-content">
                    <div class="recipe-image-container">
                        <img src="${recipeImage}" alt="${recipe.name}" class="recipe-image" 
                             onerror="this.src='${getDefaultPlaceholderImage()}'">
                    </div>
                    <div class="recipe-info">
                        <h3 class="recipe-title">${recipe.name}</h3>
                        <p class="recipe-description">${recipe.description || 'A delicious recipe for your meal plan.'}</p>
                        <div class="recipe-meta">
                            <span class="meta-item"><i class="fas fa-clock"></i> ${recipe.time} min</span>
                            <span class="meta-item"><i class="fas fa-fire"></i> ${recipe.nutrition.calories} cal</span>
                            <span class="meta-item difficulty-${recipe.difficulty?.toLowerCase() || 'medium'}">${recipe.difficulty || 'Medium'}</span>
                        </div>
                        <div class="recipe-nutrition">
                            <span class="nutrition-item">Protein: ${recipe.nutrition.protein}g</span>
                            <span class="nutrition-item">Carbs: ${recipe.nutrition.carbs}g</span>
                            <span class="nutrition-item">Fat: ${recipe.nutrition.fat}g</span>
                        </div>
                        <div class="recipe-actions">
                            <button class="btn btn-primary view-recipe" data-id="${recipe.id}">
                                <i class="fas fa-utensils"></i> View Details
                            </button>
                            <button class="btn btn-secondary add-to-planner" data-recipe='${JSON.stringify(recipe).replace(/'/g, "&apos;")}'>
                                <i class="fas fa-plus"></i> Add to Planner
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(recipeCard);
        });
        
        // Add event listeners to view recipe buttons
        container.querySelectorAll('.view-recipe').forEach(button => {
            button.addEventListener('click', function() {
                const recipeId = this.getAttribute('data-id');
                const recipe = allRecipes.find(r => r.id == recipeId);
                if (recipe) {
                    viewRecipe(recipe);
                }
            });
        });
        
        // Add event listeners to add to planner buttons
        container.querySelectorAll('.add-to-planner').forEach(button => {
            button.addEventListener('click', function() {
                const recipeData = JSON.parse(this.getAttribute('data-recipe').replace(/&apos;/g, "'"));
                quickAddToPlanner(recipeData);
            });
        });
    }

    // Helper function to get recipe image
    function getRecipeImage(recipe) {
        // If recipe has a picture property, use it
        if (recipe.picture) {
            // Check if it's a full URL or local path
            if (recipe.picture.startsWith('http')) {
                return recipe.picture;
            } else {
                // Assuming pictures are in the same directory as JSON file
                return `/static/assets/${recipe.picture}`;
            }
        }
        
        // Fallback to placeholder based on meal type
        return getRecipePlaceholderImage(recipe.meal_type);
    }

    // Helper function to get recipe placeholder image based on meal type
    function getRecipePlaceholderImage(mealType) {
        const placeholders = {
            breakfast: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=300&fit=crop',
            lunch: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
            dinner: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
            dessert: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=300&fit=crop'
        };
        return placeholders[mealType] || placeholders.lunch;
    }

    // Helper function to get default placeholder image
    function getDefaultPlaceholderImage() {
        return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';
    }
    
    function viewRecipe(recipe) {
        showRecipeModal(recipe);
    }
    
    function showRecipeModal(recipe) {
        // Remove any existing modals first
        const existingModals = document.querySelectorAll('.recipe-modal');
        existingModals.forEach(modal => modal.remove());
        
        // Get recipe image
        const recipeImage = getRecipeImage(recipe);
        
        const modalHTML = `
            <div class="modal recipe-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:2000;">
                <div style="background:white;padding:0;border-radius:12px;max-width:800px;width:95%;max-height:90vh;overflow-y:auto;position:relative;">
                    <!-- Recipe Header with Image -->
                    <div class="recipe-modal-header" style="position:relative;">
                        <img src="${recipeImage}" alt="${recipe.name}" 
                             style="width:100%;height:300px;object-fit:cover;border-radius:12px 12px 0 0;"
                             onerror="this.src='${getDefaultPlaceholderImage()}'">
                        <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent, rgba(0,0,0,0.7));padding:2rem 2rem 1rem;color:white;">
                            <h2 style="margin:0;font-size:2rem;">${recipe.name}</h2>
                            <p style="margin:0.5rem 0 0;opacity:0.9;">${recipe.description}</p>
                        </div>
                        <button class="close-modal" style="position:absolute;top:1rem;right:1rem;background:rgba(0,0,0,0.7);color:white;border:none;border-radius:50%;width:40px;height:40px;font-size:1.5rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">&times;</button>
                    </div>
                    
                    <div style="padding:2rem;">
                        <!-- Recipe Meta Information -->
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;margin-bottom:2rem;padding:1rem;background:#f8f9fa;border-radius:8px;">
                            <div style="text-align:center;">
                                <div style="font-size:0.9rem;color:#666;margin-bottom:0.25rem;">Meal Type</div>
                                <div style="font-weight:600;">${recipe.meal_type ? recipe.meal_type.charAt(0).toUpperCase() + recipe.meal_type.slice(1) : 'General'}</div>
                            </div>
                            <div style="text-align:center;">
                                <div style="font-size:0.9rem;color:#666;margin-bottom:0.25rem;">Diet</div>
                                <div style="font-weight:600;">${recipe.diet || 'Any'}</div>
                            </div>
                            <div style="text-align:center;">
                                <div style="font-size:0.9rem;color:#666;margin-bottom:0.25rem;">Time</div>
                                <div style="font-weight:600;">${recipe.time} min</div>
                            </div>
                            <div style="text-align:center;">
                                <div style="font-size:0.9rem;color:#666;margin-bottom:0.25rem;">Difficulty</div>
                                <div style="font-weight:600;color:${getDifficultyColor(recipe.difficulty)}">${recipe.difficulty || 'Medium'}</div>
                            </div>
                        </div>
                        
                        <!-- Ingredients and Instructions Side by Side -->
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-bottom:2rem;">
                            <!-- Ingredients -->
                            <div>
                                <h3 style="color:#e74c3c;margin-bottom:1rem;border-bottom:2px solid #e74c3c;padding-bottom:0.5rem;">Ingredients</h3>
                                <ul style="margin:0;padding-left:1rem;">
                                    ${recipe.ingredients.map(ing => `<li style="margin-bottom:0.5rem;padding-left:0.5rem;">${ing}</li>`).join('')}
                                </ul>
                            </div>
                            
                            <!-- Instructions -->
                            <div>
                                <h3 style="color:#e74c3c;margin-bottom:1rem;border-bottom:2px solid #e74c3c;padding-bottom:0.5rem;">Instructions</h3>
                                <ol style="margin:0;padding-left:1rem;">
                                    ${recipe.instructions.map((step, index) => `<li style="margin-bottom:1rem;padding-left:0.5rem;"><strong>Step ${index + 1}:</strong> ${step}</li>`).join('')}
                                </ol>
                            </div>
                        </div>
                        
                        <!-- Nutrition Information -->
                        <div style="margin-bottom:2rem;">
                            <h3 style="color:#e74c3c;margin-bottom:1rem;border-bottom:2px solid #e74c3c;padding-bottom:0.5rem;">Nutrition Information</h3>
                            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;text-align:center;">
                                <div style="padding:1rem;background:#3498db;color:white;border-radius:8px;">
                                    <div style="font-size:1.5rem;font-weight:bold;">${recipe.nutrition.calories}</div>
                                    <div style="font-size:0.9rem;">Calories</div>
                                </div>
                                <div style="padding:1rem;background:#2ecc71;color:white;border-radius:8px;">
                                    <div style="font-size:1.5rem;font-weight:bold;">${recipe.nutrition.protein}g</div>
                                    <div style="font-size:0.9rem;">Protein</div>
                                </div>
                                <div style="padding:1rem;background:#f39c12;color:white;border-radius:8px;">
                                    <div style="font-size:1.5rem;font-weight:bold;">${recipe.nutrition.carbs}g</div>
                                    <div style="font-size:0.9rem;">Carbs</div>
                                </div>
                                <div style="padding:1rem;background:#e74c3c;color:white;border-radius:8px;">
                                    <div style="font-size:1.5rem;font-weight:bold;">${recipe.nutrition.fat}g</div>
                                    <div style="font-size:0.9rem;">Fat</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div style="display:flex;gap:1rem;justify-content:center;border-top:1px solid #eee;padding-top:2rem;">
                            <button class="btn btn-primary quick-add-to-planner" data-recipe='${JSON.stringify(recipe).replace(/'/g, "&apos;")}' style="padding:1rem 2rem;font-size:1.1rem;">
                                <i class="fas fa-bolt"></i> Quick Add to Today
                            </button>
                            <button class="btn btn-secondary custom-add-to-planner" data-recipe='${JSON.stringify(recipe).replace(/'/g, "&apos;")}' style="padding:1rem 2rem;font-size:1.1rem;">
                                <i class="fas fa-calendar-alt"></i> Custom Schedule
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Get references to the modal elements
        const modal = document.querySelector('.recipe-modal');
        const closeBtn = modal.querySelector('.close-modal');
        const quickAddBtn = modal.querySelector('.quick-add-to-planner');
        const customAddBtn = modal.querySelector('.custom-add-to-planner');
        
        // Close modal function
        function closeModal() {
            modal.remove();
        }
        
        // Quick add button event listener
        quickAddBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const recipeData = JSON.parse(this.getAttribute('data-recipe').replace(/&apos;/g, "'"));
            closeModal();
            quickAddToPlanner(recipeData);
        });
        
        // Custom add button event listener
        customAddBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const recipeData = JSON.parse(this.getAttribute('data-recipe').replace(/&apos;/g, "'"));
            closeModal();
            customAddToPlanner(recipeData);
        });
        
        // Close button event listener
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeModal();
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', function handleEscape(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        });
    }

    // Helper function to get difficulty color
    function getDifficultyColor(difficulty) {
        const colors = {
            easy: '#2ecc71',
            medium: '#f39c12',
            hard: '#e74c3c'
        };
        return colors[difficulty?.toLowerCase()] || '#f39c12';
    }
    
    function quickAddToPlanner(recipeData) {
        // Auto-assign based on recipe meal type
        const mealType = recipeData.meal_type || 'lunch';
        const today = new Date();
        const startOfWeek = getStartOfWeek(today);
        const todayDayIndex = (today.getDay() + 6) % 7; // Convert to Monday-based week (0=Monday, 6=Sunday)
        
        // Create meal data for planner
        const mealData = {
            name: recipeData.name,
            calories: recipeData.nutrition.calories,
            protein: recipeData.nutrition.protein,
            carbs: recipeData.nutrition.carbs,
            fat: recipeData.nutrition.fat,
            mealTime: mealType.charAt(0).toUpperCase() + mealType.slice(1),
            planned: true,
            weekKey: getCurrentWeekKey(),
            dayIndex: todayDayIndex,
            mealType: mealType,
            recipeId: recipeData.id,
            isSelected: true,
            timestamp: new Date().toISOString()
        };
        
        // Save to meal planner
        saveToMealPlanner(todayDayIndex, mealType, mealData);
        
        showNotification(`Added "${recipeData.name}" to ${mealType} for ${getDayName(todayDayIndex)}!`, 'success');
    }
    
    function customAddToPlanner(recipeData) {
        // Remove any existing modals first
        const existingModals = document.querySelectorAll('.custom-planner-modal');
        existingModals.forEach(modal => modal.remove());
        
        // Show custom selection modal
        const modalHTML = `
            <div class="modal custom-planner-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:2000;">
                <div style="background:white;padding:2rem;border-radius:12px;max-width:500px;width:90%;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                        <h3 style="margin:0;color:#2c3e50;">Add to Meal Planner</h3>
                        <button class="close-modal" style="background:none;border:none;font-size:1.5rem;cursor:pointer;padding:0.5rem;line-height:1;color:#666;">&times;</button>
                    </div>
                    <p style="margin-bottom:1.5rem;color:#666;">Select when to add "<strong>${recipeData.name}</strong>"</p>
                    
                    <div class="form-group" style="margin-bottom:1rem;">
                        <label style="display:block;margin-bottom:0.5rem;font-weight:600;color:#2c3e50;">Meal Type</label>
                        <select class="form-control" id="plannerMealType" style="width:100%;padding:0.75rem;border:2px solid #e0e0e0;border-radius:8px;font-size:1rem;">
                            <option value="breakfast">🍳 Breakfast</option>
                            <option value="lunch">🥪 Lunch</option>
                            <option value="dinner">🍽️ Dinner</option>
                            <option value="dessert">🍰 Dessert</option>
                        </select>
                    </div>
                    
                    <div class="form-group" style="margin-bottom:2rem;">
                        <label style="display:block;margin-bottom:0.5rem;font-weight:600;color:#2c3e50;">Day</label>
                        <select class="form-control" id="plannerDay" style="width:100%;padding:0.75rem;border:2px solid #e0e0e0;border-radius:8px;font-size:1rem;">
                            <option value="0">📅 Monday</option>
                            <option value="1">📅 Tuesday</option>
                            <option value="2">📅 Wednesday</option>
                            <option value="3">📅 Thursday</option>
                            <option value="4">📅 Friday</option>
                            <option value="5">📅 Saturday</option>
                            <option value="6">📅 Sunday</option>
                        </select>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button class="btn btn-primary" id="confirmAddToPlanner" style="flex:1;padding:1rem;font-size:1.1rem;background:#27ae60;">
                            <i class="fas fa-check"></i> Add to Planner
                        </button>
                        <button class="btn btn-secondary" id="cancelAddToPlanner" style="padding:1rem 2rem;font-size:1.1rem;">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Get references to modal elements
        const modal = document.querySelector('.custom-planner-modal');
        const closeBtn = modal.querySelector('.close-modal');
        const confirmBtn = modal.querySelector('#confirmAddToPlanner');
        const cancelBtn = modal.querySelector('#cancelAddToPlanner');
        
        // Set default meal type based on recipe
        const defaultMealType = recipeData.meal_type || 'lunch';
        document.getElementById('plannerMealType').value = defaultMealType;
        
        // Close modal function
        function closeModal() {
            modal.remove();
        }
        
        // Confirm button event listener
        confirmBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const mealType = document.getElementById('plannerMealType').value;
            const dayIndex = parseInt(document.getElementById('plannerDay').value);
            
            // Create meal data for planner
            const mealData = {
                name: recipeData.name,
                calories: recipeData.nutrition.calories,
                protein: recipeData.nutrition.protein,
                carbs: recipeData.nutrition.carbs,
                fat: recipeData.nutrition.fat,
                mealTime: mealType.charAt(0).toUpperCase() + mealType.slice(1),
                planned: true,
                weekKey: getCurrentWeekKey(),
                dayIndex: dayIndex,
                mealType: mealType,
                recipeId: recipeData.id,
                isSelected: true,
                timestamp: new Date().toISOString()
            };
            
            // Save to meal planner
            saveToMealPlanner(dayIndex, mealType, mealData);
            closeModal();
            
            showNotification(`Added "${recipeData.name}" to ${mealType} on ${getDayName(dayIndex)}!`, 'success');
        });
        
        // Cancel button event listener
        cancelBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeModal();
        });
        
        // Close button event listener
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeModal();
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', function handleEscape(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        });
    }
    
    function saveToMealPlanner(dayIndex, mealType, mealData) {
        const mealPlans = JSON.parse(localStorage.getItem('mealPlans') || '{}');
        const currentWeekKey = getCurrentWeekKey();
        
        if (!mealPlans[currentWeekKey]) {
            mealPlans[currentWeekKey] = {};
        }
        
        mealPlans[currentWeekKey][`${dayIndex}_${mealType}`] = mealData;
        localStorage.setItem('mealPlans', JSON.stringify(mealPlans));
        
        // Sync with nutrition data
        if (typeof window.syncNutritionData === 'function') {
            window.syncNutritionData();
        }
    }
    
    function getCurrentWeekKey() {
        const today = new Date();
        const startOfWeek = getStartOfWeek(today);
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek.toISOString().split('T')[0];
    }
    
    function getStartOfWeek(date) {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(start.setDate(diff));
    }
    
    function getDayName(dayIndex) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days[dayIndex];
    }
    
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.custom-notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = 'custom-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'warning' ? '#f39c12' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 400px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;
        
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        notification.innerHTML = `${icon} ${message}`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }
});