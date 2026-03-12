package controllers

import (
	"fmt"
	"steam-motor-backend/database"
	"steam-motor-backend/models"
	"time"

	"github.com/gofiber/fiber/v2"
)

// ===================== CRUD Petugas =====================

func GetPetugases(c *fiber.Ctx) error {
	var petugases []models.Petugas
	database.DB.Order("nama asc").Find(&petugases)
	return c.JSON(petugases)
}

func CreatePetugas(c *fiber.Ctx) error {
	p := new(models.Petugas)
	if err := c.BodyParser(p); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	if result := database.DB.Create(p); result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": result.Error.Error()})
	}
	return c.Status(201).JSON(p)
}

func UpdatePetugas(c *fiber.Ctx) error {
	id := c.Params("id")
	var p models.Petugas
	if err := database.DB.First(&p, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Petugas tidak ditemukan"})
	}
	if err := c.BodyParser(&p); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	database.DB.Save(&p)
	return c.JSON(p)
}

func DeletePetugas(c *fiber.Ctx) error {
	id := c.Params("id")
	database.DB.Delete(&models.Petugas{}, id)
	return c.JSON(fiber.Map{"message": "Petugas dihapus"})
}

// ===================== Stats & Salary =====================

type PetugasStat struct {
	Nama         string  `json:"nama"`
	JumlahMotor  int64   `json:"jumlah_motor"`
	TotalGaji    float64 `json:"total_gaji"`
	SudahDibayar bool    `json:"sudah_dibayar"`
	TotalDibayar float64 `json:"total_dibayar"`
	SisaGaji     float64 `json:"sisa_gaji"`
}

const GajiPerMotor = 5000.0

func GetPetugasStats(c *fiber.Ctx) error {
	bulan := c.Query("bulan") // YYYY-MM

	var petugases []models.Petugas
	database.DB.Where("aktif = 1").Order("nama asc").Find(&petugases)

	var results []PetugasStat
	for _, p := range petugases {
		var count int64
		q := database.DB.Model(&models.Transaction{}).Where("petugas = ?", p.Nama)
		if bulan != "" {
			q = q.Where("DATE_FORMAT(tanggal, '%Y-%m') = ?", bulan)
		}
		q.Count(&count)

		// Hitung total dibayar
		keteranganFilter := fmt.Sprintf("Gaji %s – %s", p.Nama, bulan)
		var totalDibayar float64
		database.DB.Model(&models.Expense{}).
			Where("keterangan LIKE ?", keteranganFilter+"%").
			Select("COALESCE(SUM(jumlah), 0)").Scan(&totalDibayar)

		totalGaji := float64(count) * GajiPerMotor
		sisaGaji := totalGaji - totalDibayar

		results = append(results, PetugasStat{
			Nama:         p.Nama,
			JumlahMotor:  count,
			TotalGaji:    totalGaji,
			SudahDibayar: sisaGaji <= 0,
			TotalDibayar: totalDibayar,
			SisaGaji:     sisaGaji,
		})
	}

	if results == nil {
		results = []PetugasStat{}
	}
	return c.JSON(results)
}

func PayPetugasSalary(c *fiber.Ctx) error {
	var body struct {
		Nama  string `json:"nama"`
		Bulan string `json:"bulan"` // YYYY-MM
		Gaji  float64 `json:"gaji"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	// Tanggal = hari terakhir bulan itu
	now := time.Now()
	tanggal := fmt.Sprintf("%s-%02d", body.Bulan, now.Day())

	keterangan := fmt.Sprintf("Gaji %s – %s (Pembayaran ke-%d)", body.Nama, body.Bulan, now.Unix())

	exp := models.Expense{
		Tanggal:    tanggal,
		Keterangan: keterangan,
		Jumlah:     body.Gaji,
	}
	if err := database.DB.Create(&exp).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(exp)
}
