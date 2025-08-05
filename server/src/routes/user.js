/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user (super admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               role:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               national_id:
 *                 type: string
 *               gender:
 *                 type: string
 *               address:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               boarding_house_id:
 *                 type: integer
 *                 nullable: true
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users (super admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user (super admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               role:
 *                 type: string
 *               email:
 *                 type: string
 *               national_id:
 *                 type: string
 *               gender:
 *                 type: string
 *               address:
 *                 type: string
 *               phone_number:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */

const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize(['super_admin']), controller.createUser);
router.get('/', authenticate, authorize(['super_admin']), controller.listUsers);
router.put('/:id', authenticate, authorize(['super_admin']), controller.updateUser);

module.exports = router; 