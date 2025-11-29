document.addEventListener('DOMContentLoaded', function() {
    const ingredientForm = document.getElementById('ingredientForm');
    const ingredientsGrid = document.getElementById('ingredientsGrid');
    const searchSelectedBtn = document.getElementById('searchSelectedBtn');
    const selectAllBtn = document.getElementById('selectAllBtn');
    
    let allIngredientsSelected = false;
    
    // Load existing ingredients
    loadIngredients();
    
    // Add ingredient form
    ingredientForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('ingredientName').value;
        const quantity = document.getElementById('quantity').value;
        const unit = document.getElementById('unit').value;
        const category = document.getElementById('category').value;
        
        const ingredient = {
            name,
            quantity: parseInt(quantity),
            unit,
            category
        };
        
        // Send to server
        fetch('/api/ingredients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(ingredient)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                addIngredientToGrid(data.ingredient);
                ingredientForm.reset();
                updateUserStats();
                updateSearchButton();
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });
    
    // Quick add buttons
    document.querySelectorAll('.quick-add-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const name = this.getAttribute('data-ingredient');
            document.getElementById('ingredientName').value = name;
        });
    });
    
    // Search selected recipes button click handler
    searchSelectedBtn.addEventListener('click', function() {
        searchRecipesWithSelectedIngredients();
    });
    
    // Select all button click handler
    selectAllBtn.addEventListener('click', function() {
        toggleSelectAllIngredients();
    });
    
    function loadIngredients() {
        fetch('/api/ingredients')
            .then(response => response.json())
            .then(ingredients => {
                ingredientsGrid.innerHTML = '';
                ingredients.forEach(ingredient => {
                    addIngredientToGrid(ingredient);
                });
                updateUserStats();
                updateSearchButton();
            })
            .catch(error => {
                console.error('Error loading ingredients:', error);
            });
    }
    
    function addIngredientToGrid(ingredient) {
        const ingredientCard = document.createElement('div');
        ingredientCard.className = 'ingredient-card';
        ingredientCard.innerHTML = `
            <div class="ingredient-checkbox">
                <input type="checkbox" class="ingredient-select" id="ingredient-${ingredient.id}" data-ingredient="${ingredient.name}">
                <label for="ingredient-${ingredient.id}"></label>
            </div>
            <div class="ingredient-info">
                <h4>${ingredient.name}</h4>
                <div class="ingredient-meta">
                    ${ingredient.quantity} ${ingredient.unit} • ${ingredient.category}
                    <br><small>Added: ${formatDate(ingredient.added)}</small>
                </div>
            </div>
            <button class="delete-btn" data-id="${ingredient.id}">&times;</button>
        `;
        ingredientsGrid.appendChild(ingredientCard);
        
        // Add checkbox change event listener
        const checkbox = ingredientCard.querySelector('.ingredient-select');
        checkbox.addEventListener('change', function() {
            updateSearchButton();
            updateSelectAllButton();
        });
        
        // Add delete event listener
        ingredientCard.querySelector('.delete-btn').addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            deleteIngredient(id, ingredientCard);
        });
    }
    
    function deleteIngredient(id, element) {
        fetch(`/api/ingredients/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                element.remove();
                updateUserStats();
                updateSearchButton();
                updateSelectAllButton();
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
    
    function updateUserStats() {
        // Update user statistics in header
        fetch('/api/user/profile')
            .then(response => response.json())
            .then(data => {
                if (data.statistics) {
                    const stats = data.statistics;
                    const statsElement = document.getElementById('userStats');
                    if (statsElement) {
                        statsElement.textContent = 
                            `${stats.ingredient_count} ingredients • ${stats.nutrition_entries} meals`;
                    }
                }
            })
            .catch(error => {
                console.error('Error updating user stats:', error);
            });
    }
    
    // NEW FUNCTION: Update search button visibility and text
    function updateSearchButton() {
        const selectedIngredients = getSelectedIngredients();
        const selectedCount = selectedIngredients.length;
        const totalIngredients = ingredientsGrid.querySelectorAll('.ingredient-card').length;
        
        if (totalIngredients > 0) {
            searchSelectedBtn.style.display = 'flex';
            selectAllBtn.style.display = 'flex';
            
            if (selectedCount > 0) {
                searchSelectedBtn.innerHTML = `
                    <i class="fas fa-search"></i> 
                    Search Recipes with ${selectedCount} Selected Ingredient${selectedCount !== 1 ? 's' : ''}
                `;
                searchSelectedBtn.disabled = false;
            } else {
                searchSelectedBtn.innerHTML = `
                    <i class="fas fa-search"></i> 
                    Select Ingredients to Search
                `;
                searchSelectedBtn.disabled = true;
            }
        } else {
            searchSelectedBtn.style.display = 'none';
            selectAllBtn.style.display = 'none';
        }
    }
    
    // NEW FUNCTION: Update select all button state
    function updateSelectAllButton() {
        const selectedCount = getSelectedIngredients().length;
        const totalIngredients = ingredientsGrid.querySelectorAll('.ingredient-card').length;
        
        if (selectedCount === totalIngredients && totalIngredients > 0) {
            selectAllBtn.innerHTML = '<i class="fas fa-times"></i> Deselect All';
            allIngredientsSelected = true;
        } else {
            selectAllBtn.innerHTML = '<i class="fas fa-check-square"></i> Select All';
            allIngredientsSelected = false;
        }
    }
    
    // NEW FUNCTION: Get all selected ingredients
    function getSelectedIngredients() {
        const selectedIngredients = [];
        const checkboxes = ingredientsGrid.querySelectorAll('.ingredient-select:checked');
        
        checkboxes.forEach(checkbox => {
            selectedIngredients.push(checkbox.getAttribute('data-ingredient'));
        });
        
        return selectedIngredients;
    }
    
    // NEW FUNCTION: Toggle select all ingredients
    function toggleSelectAllIngredients() {
        const checkboxes = ingredientsGrid.querySelectorAll('.ingredient-select');
        const anyUnchecked = ingredientsGrid.querySelectorAll('.ingredient-select:not(:checked)').length > 0;
        
        // If any are unchecked, check all. Otherwise, uncheck all.
        const newState = anyUnchecked;
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = newState;
        });
        
        updateSearchButton();
        updateSelectAllButton();
    }
    
    // NEW FUNCTION: Search recipes with selected ingredients
    function searchRecipesWithSelectedIngredients() {
        const selectedIngredients = getSelectedIngredients();
        
        if (selectedIngredients.length === 0) {
            alert('Please select at least one ingredient to search!');
            return;
        }
        
        // Create comma-separated list of selected ingredients
        const ingredientsQuery = selectedIngredients.join(',');
        
        // Store ingredients in localStorage for the recipes page to use
        localStorage.setItem('ingredientSearch', ingredientsQuery);
        localStorage.setItem('ingredientSearchTime', new Date().getTime());
        localStorage.setItem('selectedIngredientsCount', selectedIngredients.length.toString());
        
        // Redirect to recipes page
        window.location.href = '/recipes';
    }
    
    // Initialize buttons on load
    updateSearchButton();
    updateSelectAllButton();
});