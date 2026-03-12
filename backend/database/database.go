package database

import (
	"fmt"
	"log"
	"net/url"
	"os"
	"steam-motor-backend/models"
	"strings"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	var dsn string

	rawURL := os.Getenv("DATABASE_URL")
	if rawURL == "" {
		// Local development fallback
		dsn = "root:@tcp(127.0.0.1:3306)/steammotor_db?charset=utf8mb4&parseTime=True&loc=Local"
	} else {
		// Convert mysql:// URL format to GORM DSN format
		// Input:  mysql://user:pass@host:port/dbname?ssl-mode=REQUIRED
		// Output: user:pass@tcp(host:port)/dbname?charset=utf8mb4&parseTime=True&tls=true
		rawURL = strings.Replace(rawURL, "mysql://", "http://", 1)
		u, err := url.Parse(rawURL)
		if err != nil {
			log.Fatal("Invalid DATABASE_URL format: ", err)
		}
		password, _ := u.User.Password()
		host := u.Hostname()
		port := u.Port()
		dbName := strings.TrimPrefix(u.Path, "/")
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local&tls=skip-verify",
			u.User.Username(), password, host, port, dbName)
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
