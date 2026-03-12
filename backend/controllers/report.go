package controllers

import (
	"steam-motor-backend/database"
	"steam-motor-backend/models"

	"github.com/gofiber/fiber/v2"
)

type MonthlySummary struct {
	Bulan           string  `json:"bulan"`
	TotalPendapatan float64 `json:"total_pendapatan"`
	TotalPengeluaran float64 `json:"total_pengeluaran"`
	LabaBersih      float64 `json:"laba_bersih"`
}

func GetMonthlySummary(c *fiber.Ctx) error {
	year := c.Query("tahun")

	// Get monthly income
	var incomeData []struct {
		Month string
		Total float64
	}
	incomeQuery := database.DB.Model(&models.Transaction{}).
		Select("DATE_FORMAT(tanggal, '%Y-%m') as month, SUM(harga) as total")
	if year != "" {
		incomeQuery = incomeQuery.Where("DATE_FORMAT(tanggal, '%Y') = ?", year)
	}
	incomeQuery.Group("month").Order("month desc").Scan(&incomeData)

	// Get monthly expenses
	var expenseData []struct {
		Month string
		Total float64
	}
	expenseQuery := database.DB.Model(&models.Expense{}).
		Select("DATE_FORMAT(tanggal, '%Y-%m') as month, SUM(jumlah) as total")
	if year != "" {
		expenseQuery = expenseQuery.Where("DATE_FORMAT(tanggal, '%Y') = ?", year)
	}
	expenseQuery.Group("month").Order("month desc").Scan(&expenseData)

	// Merge data
	summaryMap := make(map[string]*MonthlySummary)

	for _, inc := range incomeData {
		summaryMap[inc.Month] = &MonthlySummary{
			Bulan:           inc.Month,
			TotalPendapatan: inc.Total,
		}
	}

	for _, exp := range expenseData {
		if s, ok := summaryMap[exp.Month]; ok {
			s.TotalPengeluaran = exp.Total
			s.LabaBersih = s.TotalPendapatan - exp.Total
		} else {
			summaryMap[exp.Month] = &MonthlySummary{
				Bulan:           exp.Month,
				TotalPengeluaran: exp.Total,
				LabaBersih:      -exp.Total,
			}
		}
	}

	// Calculate LabaBersih for all
	for _, s := range summaryMap {
		s.LabaBersih = s.TotalPendapatan - s.TotalPengeluaran
	}

	// Convert to slice and sort
	var finalResults []MonthlySummary
	// Note: In real app we might want more complex sorting, 
	// but here we just iterate the map and then sort manually or rely on 
	// existing logic. Let's just collect and return. 
	// Actually, easier to get all unique months first.
	
	allMonths := make(map[string]bool)
	for m := range summaryMap {
		allMonths[m] = true
	}

	// For simplicity, let's just return what we have in a deterministic order (descending)
	for _, s := range summaryMap {
		finalResults = append(finalResults, *s)
	}
    
    // Sort descending by month string (YYYY-MM)
    for i := 0; i < len(finalResults); i++ {
        for j := i + 1; j < len(finalResults); j++ {
            if finalResults[i].Bulan < finalResults[j].Bulan {
                finalResults[i], finalResults[j] = finalResults[j], finalResults[i]
            }
        }
    }

	return c.JSON(finalResults)
}
