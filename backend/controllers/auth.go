package controllers

import (
	"log"
	"steam-motor-backend/database"
	"steam-motor-backend/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

const SecretKey = "secret_key_steammotor" // In production, use env variables

func Login(c *fiber.Ctx) error {
	var data map[string]string

	if err := c.BodyParser(&data); err != nil {
		return err
	}

	var user models.User
	database.DB.Where("username = ?", data["username"]).First(&user)

	if user.ID == 0 {
		log.Printf("Login failed: User '%s' not found", data["username"])
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"message": "User not found",
		})
	}

	log.Printf("Attempting login for user: %s", user.Username)
	log.Printf("Password in DB (length %d): [%s]", len(user.Password), user.Password)
	log.Printf("Input Password (length %d): [%s]", len(data["password"]), data["password"])

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(data["password"])); err != nil {
		log.Printf("Bcrypt comparison failed: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Incorrect password",
		})
	}
	log.Println("Login success!")

	claims := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Issuer:    user.Username,
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 24)), // 1 day expiration
	})

	token, err := claims.SignedString([]byte(SecretKey))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Could not login",
		})
	}

	return c.JSON(fiber.Map{
		"message": "success",
		"token":   token,
	})
}
