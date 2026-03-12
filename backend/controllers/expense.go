package controllers

import (
	"steam-motor-backend/database"
	"steam-motor-backend/models"

	"github.com/gofiber/fiber/v2"
)

func GetExpenses(c *fiber.Ctx) error {
	var expenses []models.Expense
	query := database.DB.Model(&models.Expense{})

	if date := c.Query("tanggal"); date != "" {
		query = query.Where("DATE(tanggal) = ?", date)
	}
	if month := c.Query("bulan"); month != "" {
		query = query.Where("DATE_FORMAT(tanggal, '%Y-%m') = ?", month)
	}

	query.Order("tanggal desc, id desc").Find(&expenses)
	return c.JSON(expenses)
}

func CreateExpense(c *fiber.Ctx) error {
	var expense models.Expense
	if err := c.BodyParser(&expense); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	database.DB.Create(&expense)
	return c.JSON(expense)
}

func UpdateExpense(c *fiber.Ctx) error {
	id := c.Params("id")
	var expense models.Expense

	if result := database.DB.First(&expense, id); result.Error != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Expense not found"})
	}
	if err := c.BodyParser(&expense); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	database.DB.Save(&expense)
	return c.JSON(expense)
}

func DeleteExpense(c *fiber.Ctx) error {
	id := c.Params("id")
	var expense models.Expense

	if result := database.DB.First(&expense, id); result.Error != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Expense not found"})
	}
	database.DB.Delete(&expense)
	return c.JSON(fiber.Map{"message": "success"})
}
