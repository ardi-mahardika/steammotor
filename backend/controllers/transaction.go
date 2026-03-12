package controllers

import (
	"steam-motor-backend/database"
	"steam-motor-backend/models"

	"github.com/gofiber/fiber/v2"
)

func GetTransactions(c *fiber.Ctx) error {
	var transactions []models.Transaction
	query := database.DB.Model(&models.Transaction{})

	if date := c.Query("tanggal"); date != "" {
		query = query.Where("DATE(tanggal) = ?", date)
	}
	if nopol := c.Query("no_polisi"); nopol != "" {
		query = query.Where("no_polisi LIKE ?", "%"+nopol+"%")
	}

	query.Order("tanggal desc, id desc").Find(&transactions)
	return c.JSON(transactions)
}

func CreateTransaction(c *fiber.Ctx) error {
	var transaction models.Transaction
	if err := c.BodyParser(&transaction); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	database.DB.Create(&transaction)
	return c.JSON(transaction)
}

func UpdateTransaction(c *fiber.Ctx) error {
	id := c.Params("id")
	var transaction models.Transaction

	if result := database.DB.First(&transaction, id); result.Error != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Transaction not found"})
	}

	if err := c.BodyParser(&transaction); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	database.DB.Save(&transaction)
	return c.JSON(transaction)
}

func DeleteTransaction(c *fiber.Ctx) error {
	id := c.Params("id")
	var transaction models.Transaction

	if result := database.DB.First(&transaction, id); result.Error != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Transaction not found"})
	}

	database.DB.Delete(&transaction)
	return c.JSON(fiber.Map{"message": "success"})
}

func GetReports(c *fiber.Ctx) error {
	date := c.Query("tanggal")

	var todayCount, monthCount int64
	var todayIncome, monthIncome, monthExpense float64

	currentMonth := ""
	if date != "" && len(date) >= 7 {
		currentMonth = date[:7]
	}

	// Monthly Income Stats (Using DATE_FORMAT for precision)
	monthQuery := database.DB.Model(&models.Transaction{})
	if currentMonth != "" {
		monthQuery = monthQuery.Where("DATE_FORMAT(tanggal, '%Y-%m') = ?", currentMonth)
	}
	monthQuery.Count(&monthCount)
	monthQuery.Select("COALESCE(SUM(harga), 0)").Scan(&monthIncome)

	// Monthly Expense Stats
	expenseQuery := database.DB.Model(&models.Expense{})
	if currentMonth != "" {
		expenseQuery = expenseQuery.Where("DATE_FORMAT(tanggal, '%Y-%m') = ?", currentMonth)
	}
	expenseQuery.Select("COALESCE(SUM(jumlah), 0)").Scan(&monthExpense)

	// Today Stats (Using DATE() for precision)
	todayQuery := database.DB.Model(&models.Transaction{})
	if date != "" {
		todayQuery = todayQuery.Where("DATE(tanggal) = ?", date)
	}
	todayQuery.Count(&todayCount)
	todayQuery.Select("COALESCE(SUM(harga), 0)").Scan(&todayIncome)

	netIncome := monthIncome - monthExpense

	return c.JSON(fiber.Map{
		"today_motor":   todayCount,
		"today_income":  todayIncome,
		"month_motor":   monthCount,
		"month_income":  monthIncome,
		"month_expense": monthExpense,
		"net_income":    netIncome,
	})
}
