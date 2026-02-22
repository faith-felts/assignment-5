// Import packages, initialize an express app, and define the port you will use
const express = require('express');
const { body, validationResult } = require('express-validator');
const app = express();
const port = 3000;



// Data for the server
const menuItems = [
  {
    id: 1,
    name: "Classic Burger",
    description: "Beef patty with lettuce, tomato, and cheese on a sesame seed bun",
    price: 12.99,
    category: "entree",
    ingredients: ["beef", "lettuce", "tomato", "cheese", "bun"],
    available: true
  },
  {
    id: 2,
    name: "Chicken Caesar Salad",
    description: "Grilled chicken breast over romaine lettuce with parmesan and croutons",
    price: 11.50,
    category: "entree",
    ingredients: ["chicken", "romaine lettuce", "parmesan cheese", "croutons", "caesar dressing"],
    available: true
  },
  {
    id: 3,
    name: "Mozzarella Sticks",
    description: "Crispy breaded mozzarella served with marinara sauce",
    price: 8.99,
    category: "appetizer",
    ingredients: ["mozzarella cheese", "breadcrumbs", "marinara sauce"],
    available: true
  },
  {
    id: 4,
    name: "Chocolate Lava Cake",
    description: "Warm chocolate cake with molten center, served with vanilla ice cream",
    price: 7.99,
    category: "dessert",
    ingredients: ["chocolate", "flour", "eggs", "butter", "vanilla ice cream"],
    available: true
  },
  {
    id: 5,
    name: "Fresh Lemonade",
    description: "House-made lemonade with fresh lemons and mint",
    price: 3.99,
    category: "beverage",
    ingredients: ["lemons", "sugar", "water", "mint"],
    available: true
  },
  {
    id: 6,
    name: "Fish and Chips",
    description: "Beer-battered cod with seasoned fries and coleslaw",
    price: 14.99,
    category: "entree",
    ingredients: ["cod", "beer batter", "potatoes", "coleslaw", "tartar sauce"],
    available: false
  }
];

// Define routes and implement middleware here
// Middleware to parse JSON requests
app.use(express.json());

// Middleware to log incoming requests
const requestLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  
    // Log request body for POST and PUT requests
    if (req.method === 'POST' || req.method === 'PUT') {
      console.log('Request Body:',
      JSON.stringify(req.body, null, 2));
    }
  
    next(); // Pass control to next middleware
};

// Use the request logger middleware for all routes
app.use(requestLogger);


// Validation rules for menu items (used for POST/PUT /api/menu)
const todoValidation = [
  body('name')
    .isLength({ min: 3 })
    .withMessage('Name must be at least 3 characters long'),

  body('description')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),

  body('price')
    .isFloat({ gt: 0 })
    .withMessage('Price must be a number greater than 0'),

  body('category')
    .isIn(['appetizer', 'entree', 'dessert', 'beverage'])
    .withMessage('Category must be one of appetizer, entree, dessert, beverage'),

  body('ingredients')
    .isArray({ min: 1 })
    .withMessage('Ingredients must be an array with at least one item'),

  body('ingredients.*')
    .isString()
    .withMessage('Each ingredient must be a string'),

  body('available')
    .optional()
    .isBoolean()
    .withMessage('Available must be true or false')
];


const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
  
    if (!errors.isEmpty()) {
        const errorMessages =
    errors.array().map(error => error.msg);
    
        return res.status(400).json({
            error: 'Validation failed',
            messages: errorMessages
        });
    }
  
    // Set default value for available if not provided
    if (req.body.available === undefined) {
      req.body.available = true;
    }
  
    next();
};





// Keep an immutable snapshot of the initial menu items so tests can reset state
const initialMenuItems = JSON.parse(JSON.stringify(menuItems));



// Root endpoint - API homepage
app.get('/', (req, res) => {
    res.json({ 
        message: "Welcome to the Menu API", 
        endpoints: { 
            "GET /api/menu": "Get all menu items", 
            "GET /api/menu/:id": "Get a specific menu item by ID" 
        } 
    }); 
});



// GET /api/menu - Return all menu items
app.get('/api/menu', (req, res) => {
      // Sends back the menu items as JSON as the response to the request
      res.json(menuItems);
});


// GET /api/menu/:id - Return a specific menu item by ID
app.get('/api/menu/:id', (req, res) => {
    const menuId = parseInt(req.params.id);
    const menuItem = menuItems.find(m => m.id === menuId);
  
	// Return menuItem if it is found
    if (menuItem) {
        res.json(menuItem);
    } else {
        res.status(404).json({ error: 'Menu item not found' });
    }
});

// POST /api/menu - Add a new menu item
app.post('/api/menu', todoValidation, handleValidationErrors, (req, res) => {
    // Reject empty request bodies with 400 (validation)
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: 'Request body required' });
    }

    // Safely extract data from request body
    const { name, description, price, category, ingredients, available } = req.body;

    // Create new menu item with generated ID (fields may be undefined)
    const newMenuItem = {
        id: menuItems.length + 1,
        name: name,
        description: description,
        price: price,
        category: category,
        ingredients: ingredients,
        available: available
    };
  
    // Add to menu items array
    menuItems.push(newMenuItem);

    // Return the created menu item with 201 status
    res.status(201).json(newMenuItem);
});

// PUT /api/menu/:id - Update an existing menu item
app.put('/api/menu/:id', todoValidation, handleValidationErrors, (req, res) => {
    const menuId = parseInt(req.params.id);
    const { name, description, price, category, ingredients, available } = req.body;
  
    // Find the menu item to update
    const menuItemIndex = menuItems.findIndex(m => m.id === menuId);
  
    if (menuItemIndex === -1) {
          return res.status(404).json({ error: 'Menu item not found' });
    }
  
    // Update the menu item
    menuItems[menuItemIndex] = {
        id: menuId,
        name,
        description,
        price,
        category,
        ingredients,
        available
    };
  
    // Return the updated menu item
    res.json(menuItems[menuItemIndex]);
});

// DELETE /api/menu/:id - Delete a menu item
app.delete('/api/menu/:id', (req, res) => {
    const menuId = parseInt(req.params.id);
  
    // Find the menu item index
    const menuItemIndex = menuItems.findIndex(m => m.id === menuId);
  
    if (menuItemIndex === -1) {
        return res.status(404).json({ error: 'Menu item not found' });
    }
  
    // Remove the menu item from array
    const deletedMenuItem = menuItems.splice(menuItemIndex, 1)[0];
  
    // Return the deleted menu item
    res.json({ message: 'Menu item deleted successfully', menuItem: deletedMenuItem });
});




// Only start server when running directly, not when testing

app.listen(port, () => {
      console.log(`Restaurant API server running at http://localhost:${port}`);
});


