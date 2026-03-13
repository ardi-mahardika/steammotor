package main

import (
	"steam-motor-backend/controllers"
	"steam-motor-backend/database"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"os"
)

func main() {
	database.ConnectDB()

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
	}))

	// Routes
	app.Post("/api/login", controllers.Login)
	
	app.Get("/api/transactions", controllers.GetTransactions)
	app.Post("/api/transactions", controllers.CreateTransaction)
	app.Put("/api/transactions/:id", controllers.UpdateTransaction)
	app.Delete("/api/transactions/:id", controllers.DeleteTransaction)

	app.Get("/api/expenses", controllers.GetExpenses)
	app.Post("/api/expenses", controllers.CreateExpense)
	app.Put("/api/expenses/:id", controllers.UpdateExpense)
	app.Delete("/api/expenses/:id", controllers.DeleteExpense)
	
	app.Get("/api/reports", controllers.GetReports)
	app.Get("/api/monthly-summary", controllers.GetMonthlySummary)

	app.Get("/api/petugases", controllers.GetPetugases)
	app.Post("/api/petugases", controllers.CreatePetugas)
	app.Put("/api/petugases/:id", controllers.UpdatePetugas)
	app.Delete("/api/petugases/:id", controllers.DeletePetugas)
	app.Get("/api/petugas-stats", controllers.GetPetugasStats)
	app.Post("/api/petugas-salary", controllers.PayPetugasSalary)

	app.Get("/api/assets", controllers.GetAssets)
	app.Post("/api/assets", controllers.CreateAsset)
	app.Put("/api/assets/:id", controllers.UpdateAsset)
	app.Delete("/api/assets/:id", controllers.DeleteAsset)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}
	app.Listen(":" + port)
}

