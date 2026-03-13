package controllers

import (
	"steam-motor-backend/database"
	"steam-motor-backend/models"

	"github.com/gofiber/fiber/v2"
)

func GetAssets(c *fiber.Ctx) error {
	var assets []models.Asset
	database.DB.Order("id desc").Find(&assets)
	return c.JSON(assets)
}

func CreateAsset(c *fiber.Ctx) error {
	var asset models.Asset

	if err := c.BodyParser(&asset); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Bad request",
		})
	}

	database.DB.Create(&asset)
	return c.JSON(asset)
}

func UpdateAsset(c *fiber.Ctx) error {
	id := c.Params("id")
	var asset models.Asset

	if err := database.DB.First(&asset, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"message": "Asset not found",
		})
	}

	if err := c.BodyParser(&asset); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Bad request",
		})
	}

	database.DB.Save(&asset)
	return c.JSON(asset)
}

func DeleteAsset(c *fiber.Ctx) error {
	id := c.Params("id")
	var asset models.Asset

	if err := database.DB.First(&asset, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"message": "Asset not found",
		})
	}

	database.DB.Delete(&asset)
	return c.JSON(fiber.Map{
		"message": "Asset deleted successfully",
	})
}
