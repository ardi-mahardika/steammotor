package database

import (
	"log"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	// DSN format: user:pass@tcp(127.0.0.1:3306)/dbname?charset=utf8mb4&parseTime=True&loc=Local
	// For demo purposes, assuming root with no password on localhost. We will configure this.
	// We use steammotor_db created earlier.
	dsn := "root:@tcp(127.0.0.1:3306)/steammotor_db?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database. \n", err)
	}

	DB = db
	log.Println("Database connection successfully opened")
}
