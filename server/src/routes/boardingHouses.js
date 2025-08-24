const express = require('express');
const router = express.Router();
const boardingHouseController = require('../controllers/boardingHouseController');

// All routes require authentication

// Get all boarding houses
router.get('/', boardingHouseController.listBoardingHouses);

// Create a new boarding house (super_admin only)
router.post('/', boardingHouseController.createBoardingHouse);

// Update a boarding house (super_admin only)
router.put('/:id',  boardingHouseController.updateBoardingHouse);

// Get available admins for boarding houses
router.get('/available-admins', boardingHouseController.getAvailableAdmins);

module.exports = router;