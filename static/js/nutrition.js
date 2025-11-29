document.addEventListener('DOMContentLoaded', function() {
    console.log('=== NUTRITION TAB LOADED ===');
    
    let macroChart;
    
    // Initialize everything
    initializeChart();
    loadNutritionData();
    
    function initializeChart() {
        const ctx = document.getElementById('macroChart');
        if (!ctx) {
            console.error('Macro chart canvas not found!');
            return;
        }
        
        macroChart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Protein', 'Carbs', 'Fat'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [
                        '#3498db',
                        '#2ecc71', 
                        '#f39c12'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                return `${label}: ${value.toFixed(1)}%`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    function loadNutritionData() {
        console.log('=== DEBUG: Checking week alignment ===');

        // Get data once at the beginning - NO DUPLICATES
        const mealPlans = JSON.parse(localStorage.getItem('mealPlans') || '{}');
        const currentWeekKey = getCurrentWeekKey();
        const currentPlan = mealPlans[currentWeekKey] || {};

        // Debug logs
        console.log('All available weeks in localStorage:', Object.keys(mealPlans));
        console.log('Nutrition looking for week:', currentWeekKey);
        console.log('Data found for this week:', currentPlan);
        console.log('Full mealPlans data:', mealPlans);

        console.log('Loading nutrition data...');
        
        // Use the variables already declared above - NO DUPLICATE DECLARATIONS
        console.log('Current week key:', currentWeekKey);
        console.log('All meal plans:', mealPlans);
        console.log('Current plan for this week:', currentPlan);
        
        // Check if we have any data at all
        if (Object.keys(currentPlan).length === 0) {
            console.warn('⚠️ No meal plan data found for current week!');
            console.log('Available weeks:', Object.keys(mealPlans));
            console.log('Current week key being used:', currentWeekKey);
        }
        
        // Calculate today's data - ONLY SELECTED MEALS
        const todayData = calculateTodayData(currentPlan);
        console.log('Today data calculated:', todayData);
        
        // Calculate weekly data - ONLY SELECTED MEALS
        const weeklyData = calculateWeeklyData(currentPlan);
        console.log('Weekly data calculated:', weeklyData);
        
        // Get targets
        const targets = getNutritionTargets();
        console.log('Nutrition targets:', targets);
        
        // Update UI
        updateNutritionSummary(todayData.totals, todayData.percentages, targets);
        updateMacroChart(todayData.totals);
        updateWeeklyProgress(weeklyData, targets);
        updateUserStats(currentPlan, todayData.totals);
        
        console.log('=== NUTRITION DATA LOADED ===');
    }
    
    function calculateTodayData(currentPlan) {
        const todayDayIndex = getTodayDayIndex();
        console.log('Today day index:', todayDayIndex, '(0=Monday, 1=Tuesday, ..., 6=Sunday)');

        let todayTotals = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        };

        let foundMeals = 0;

        // Sum only SELECTED meals for today
        Object.keys(currentPlan).forEach(key => {
            const [dayIndex, meal] = key.split('_');
            const dayNum = parseInt(dayIndex);

            console.log(`Checking: day ${dayNum} vs today ${todayDayIndex} - ${key}`);

            if (dayNum === todayDayIndex) {
                const mealData = currentPlan[key];
                
                if (!mealData) {
                    console.log(`❌ No meal data for:`, key);
                    return;
                }
                
                // Check if meal is selected (default to true if property doesn't exist)
                const isSelected = mealData.isSelected === undefined || mealData.isSelected === true;
                
                if (isSelected && hasRealNutritionData(mealData)) {
                    console.log(`✅ Adding SELECTED meal for today:`, mealData.name);
                    todayTotals.calories += Number(mealData.calories) || 0;
                    todayTotals.protein += Number(mealData.protein) || 0;
                    todayTotals.carbs += Number(mealData.carbs) || 0;
                    todayTotals.fat += Number(mealData.fat) || 0;
                    foundMeals++;
                } else {
                    console.log(`❌ Skipping meal:`, mealData.name, '- Selected:', isSelected, '- HasData:', hasRealNutritionData(mealData));
                }
            }
        });

        console.log(`Found ${foundMeals} meals for today`);
        console.log('Final today totals:', todayTotals);

        const targets = getNutritionTargets();
        const percentages = {
            calories: todayTotals.calories > 0 ? Math.min(100, (todayTotals.calories / targets.calories) * 100) : 0,
            protein: todayTotals.protein > 0 ? Math.min(100, (todayTotals.protein / targets.protein) * 100) : 0,
            carbs: todayTotals.carbs > 0 ? Math.min(100, (todayTotals.carbs / targets.carbs) * 100) : 0,
            fat: todayTotals.fat > 0 ? Math.min(100, (todayTotals.fat / targets.fat) * 100) : 0
        };

        return { totals: todayTotals, percentages };
    }

    function calculateWeeklyData(currentPlan) {
        const weekData = {
            'Mon': { calories: 0, protein: 0, carbs: 0, fat: 0 },
            'Tue': { calories: 0, protein: 0, carbs: 0, fat: 0 },
            'Wed': { calories: 0, protein: 0, carbs: 0, fat: 0 },
            'Thu': { calories: 0, protein: 0, carbs: 0, fat: 0 },
            'Fri': { calories: 0, protein: 0, carbs: 0, fat: 0 },
            'Sat': { calories: 0, protein: 0, carbs: 0, fat: 0 },
            'Sun': { calories: 0, protein: 0, carbs: 0, fat: 0 }
        };

        const dayMap = {
            '0': 'Mon',
            '1': 'Tue', 
            '2': 'Wed',
            '3': 'Thu',
            '4': 'Fri',
            '5': 'Sat',
            '6': 'Sun'
        };

        let totalMealsAdded = 0;

        Object.keys(currentPlan).forEach(key => {
            const [dayIndex, meal] = key.split('_');
            const mealData = currentPlan[key];
            const dayAbbr = dayMap[dayIndex];

            if (!mealData || !dayAbbr) {
                console.log(`❌ Invalid data for key:`, key);
                return;
            }

            // Check if meal is selected (default to true if property doesn't exist)
            const isSelected = mealData.isSelected === undefined || mealData.isSelected === true;
            
            if (weekData[dayAbbr] && isSelected && hasRealNutritionData(mealData)) {
                console.log(`✅ Adding SELECTED meal to ${dayAbbr}:`, mealData.name);
                weekData[dayAbbr].calories += Number(mealData.calories) || 0;
                weekData[dayAbbr].protein += Number(mealData.protein) || 0;
                weekData[dayAbbr].carbs += Number(mealData.carbs) || 0;
                weekData[dayAbbr].fat += Number(mealData.fat) || 0;
                totalMealsAdded++;
            } else {
                console.log(`❌ Skipping meal for ${dayAbbr}:`, mealData.name, '- Selected:', isSelected, '- HasData:', hasRealNutritionData(mealData));
            }
        });

        console.log(`Added ${totalMealsAdded} meals to weekly data`);
        console.log('Final weekly data:', weekData);
        return weekData;
    }
    
    // Helper function to check if meal has real nutrition data
    function hasRealNutritionData(mealData) {
        if (!mealData) return false;
        
        const hasCalories = mealData.calories && Number(mealData.calories) > 0;
        const hasProtein = mealData.protein && Number(mealData.protein) > 0;
        const hasCarbs = mealData.carbs && Number(mealData.carbs) > 0;
        const hasFat = mealData.fat && Number(mealData.fat) > 0;
        
        return hasCalories || hasProtein || hasCarbs || hasFat;
    }
    
    function updateUserStats(currentPlan, todayTotals) {
        const statsElement = document.getElementById('userStats');
        if (!statsElement) {
            console.error('User stats element not found!');
            return;
        }
        
        const todayDayIndex = getTodayDayIndex();
        let todayMeals = 0;
        let totalSelectedMeals = 0;
        
        // Count meals
        Object.keys(currentPlan).forEach(key => {
            const [dayIndex, meal] = key.split('_');
            const mealData = currentPlan[key];
            
            if (!mealData) return;
            
            // Check if meal is selected and has real data
            const isSelected = mealData.isSelected === undefined || mealData.isSelected === true;
            const hasRealData = hasRealNutritionData(mealData);
            
            if (isSelected && hasRealData) {
                totalSelectedMeals++;
                if (parseInt(dayIndex) === todayDayIndex) {
                    todayMeals++;
                }
            }
        });
        
        const todayCalories = todayTotals.calories;
        
        statsElement.textContent = `${todayMeals} meals today • ${todayCalories} calories • ${totalSelectedMeals} meals this week`;
        
        // Update color based on activity
        if (todayMeals > 0 || todayCalories > 0) {
            statsElement.style.color = '#e74c3c';
            statsElement.style.fontWeight = '600';
        } else {
            statsElement.style.color = '#666';
            statsElement.style.fontWeight = 'normal';
        }
        
        console.log('User stats updated:', { todayMeals, todayCalories, totalSelectedMeals });
    }
    
    function updateNutritionSummary(totals, percentages, targets) {
        console.log('Updating nutrition summary with:', { totals, percentages, targets });
        
        updateProgressCircle('calories', totals.calories, targets.calories, percentages.calories);
        updateProgressCircle('protein', totals.protein, targets.protein, percentages.protein);
        updateProgressCircle('carbs', totals.carbs, targets.carbs, percentages.carbs);
        updateProgressCircle('fat', totals.fat, targets.fat, percentages.fat);
    }
    
    function updateProgressCircle(type, current, target, percentage) {
        console.log(`Updating ${type} circle:`, { current, target, percentage });
        
        const summaryCards = document.querySelectorAll('.summary-card');
        let circle, valueSpan, labelSpan;
        
        summaryCards.forEach(card => {
            if (card.classList.contains(type)) {
                circle = card.querySelector('.progress-circle');
                valueSpan = circle?.querySelector('.value');
                labelSpan = circle?.querySelector('.label');
            }
        });
        
        if (circle && valueSpan && labelSpan) {
            console.log(`Found ${type} elements, updating...`);
            
            valueSpan.textContent = type === 'calories' ? current : `${current}g`;
            labelSpan.textContent = ` / ${target}${type === 'calories' ? ' cal' : 'g'}`;
            
            // Update progress visualization
            if (percentage >= 100) {
                circle.style.background = `conic-gradient(#27ae60 0% 100%)`;
            } else if (percentage > 0) {
                circle.style.background = `conic-gradient(var(--secondary) 0% ${percentage}%, #f0f0f0 ${percentage}% 100%)`;
            } else {
                circle.style.background = `conic-gradient(#f0f0f0 0% 100%)`;
            }
            
            // Update text colors
            if (current > 0) {
                valueSpan.style.color = '#e74c3c';
                valueSpan.style.fontWeight = '600';
            } else {
                valueSpan.style.color = '#666';
                valueSpan.style.fontWeight = 'normal';
            }
        } else {
            console.error(`Could not find ${type} progress circle elements!`);
        }
    }
    
    function updateMacroChart(totals) {
        if (!macroChart) {
            console.error('Macro chart not initialized!');
            return;
        }
        
        const totalMacros = totals.protein + totals.carbs + totals.fat;
        console.log('Updating macro chart with totals:', totals, 'Total macros:', totalMacros);
        
        if (totalMacros > 0) {
            const proteinPercent = (totals.protein / totalMacros) * 100;
            const carbsPercent = (totals.carbs / totalMacros) * 100;
            const fatPercent = (totals.fat / totalMacros) * 100;
            
            macroChart.data.datasets[0].data = [proteinPercent, carbsPercent, fatPercent];
            console.log('Macro chart percentages:', [proteinPercent, carbsPercent, fatPercent]);
        } else {
            // Show zero when no data
            macroChart.data.datasets[0].data = [0, 0, 0];
            console.log('No macro data, setting chart to zeros');
        }
        
        macroChart.update();
    }
    
    function updateWeeklyProgress(weekData, targets) {
        console.log('Updating weekly progress with:', { weekData, targets });
        
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        days.forEach((day, index) => {
            const progressItem = document.querySelectorAll('.progress-item')[index];
            if (progressItem) {
                const dayData = weekData[day];
                const calories = dayData?.calories || 0;
                const protein = dayData?.protein || 0;
                const carbs = dayData?.carbs || 0;
                const fat = dayData?.fat || 0;
                
                const caloriePercentage = Math.min(100, (calories / targets.calories) * 100) || 0;
                
                console.log(`Updating ${day}: ${calories} cal (${caloriePercentage}%)`);
                
                const progressFill = progressItem.querySelector('.progress-fill');
                if (progressFill) {
                    progressFill.style.width = `${caloriePercentage}%`;
                    progressFill.style.background = caloriePercentage >= 100 ? '#27ae60' : 
                                                  caloriePercentage > 0 ? '#e74c3c' : '#f0f0f0';
                }
                
                // Update nutrition info
                let nutritionInfo = progressItem.querySelector('.nutrition-info');
                if (!nutritionInfo) {
                    nutritionInfo = document.createElement('div');
                    nutritionInfo.className = 'nutrition-info';
                    nutritionInfo.style.cssText = `
                        font-size: 0.7rem;
                        color: #666;
                        margin-top: 0.25rem;
                        line-height: 1.2;
                    `;
                    progressItem.appendChild(nutritionInfo);
                }
                
                nutritionInfo.innerHTML = `
                    <div><strong>${calories}/${targets.calories} cal</strong></div>
                    <div>Protein: ${protein}g</div>
                    <div>Carbs: ${carbs}g</div>
                    <div>Fat: ${fat}g</div>
                `;
                
                // Update day label
                const daySpan = progressItem.querySelector('span:first-child');
                if (daySpan) {
                    daySpan.textContent = day;
                    
                    // Highlight current day
                    const todayDayIndex = getTodayDayIndex();
                    const dayMap = {0: 'Mon', 1: 'Tue', 2: 'Wed', 3: 'Thu', 4: 'Fri', 5: 'Sat', 6: 'Sun'};
                    if (day === dayMap[todayDayIndex]) {
                        daySpan.style.color = '#e74c3c';
                        daySpan.style.fontWeight = 'bold';
                    } else {
                        daySpan.style.color = '#2c3e50';
                        daySpan.style.fontWeight = '600';
                    }
                }
                
                // Update calorie text
                const calorieSpan = progressItem.querySelector('span:last-child');
                if (calorieSpan) {
                    calorieSpan.textContent = `${calories}/${targets.calories} cal`;
                    calorieSpan.style.color = calories > 0 ? '#e74c3c' : '#666';
                    calorieSpan.style.fontWeight = calories > 0 ? '600' : 'normal';
                }
            }
        });
    }
    
    function getCurrentWeekKey() {
        const today = new Date();
        const startOfWeek = getStartOfWeek(today);
        const weekKey = startOfWeek.toISOString().split('T')[0];
        console.log('Nutrition - Calculated current week key:', weekKey);
        return weekKey;
    }
    
    function getTodayDayIndex() {
        const today = new Date();
        const dayIndex = today.getDay();
        let adjustedDayIndex = dayIndex - 1;
        if (adjustedDayIndex < 0) adjustedDayIndex = 6;
        console.log('Today day index calculated:', adjustedDayIndex, '(Today is:', today.toDateString() + ')');
        return adjustedDayIndex;
    }
    
    function getStartOfWeek(date) {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(start.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0);
        console.log('Nutrition - Start of week calculated:', startOfWeek);
        return startOfWeek;
    }
    
    function getNutritionTargets() {
        const preferences = JSON.parse(localStorage.getItem('dietPreferences') || '{}');
        const calorieTarget = preferences.calorieTarget || 2000;
        
        const targets = {
            calories: calorieTarget,
            protein: Math.round((calorieTarget * 0.3) / 4),
            carbs: Math.round((calorieTarget * 0.5) / 4),
            fat: Math.round((calorieTarget * 0.2) / 9)
        };
        
        console.log('Nutrition targets calculated:', targets);
        return targets;
    }
    
    // Make function globally available
    window.updateNutritionData = loadNutritionData;
    
    // Auto-refresh every 3 seconds
    setInterval(loadNutritionData, 3000);
    
    console.log('Nutrition tab ready!');
});

// Global sync function
window.syncNutritionData = function() {
    console.log('=== SYNC TRIGGERED FROM MEAL PLANNER ===');
    if (typeof window.updateNutritionData === 'function') {
        window.updateNutritionData();
    }
};