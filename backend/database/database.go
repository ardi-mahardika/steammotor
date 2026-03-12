package database

import (
	"log"
	"os"
	"steam-motor-backend/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	// Let's use an environment variable for the production Cloud Database
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		// Local development fallback
		dsn = "root:@tcp(127.0.0.1:3306)/steammotor_db?charset=utf8mb4&parseTime=True&loc=Local"
	}

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database. \n", err)
	}

	// Migrate the schema (Auto-creates tables if they don't exist)
	err = db.AutoMigrate(&models.User{}, &models.Transaction{}, &models.Expense{}, &models.Petugas{})
	if err != nil {
		log.Fatal("Failed to migrate database schema. \n", err)
	}

	DB = db
	log.Println("Database connection successfully opened")
}

