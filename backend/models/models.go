package models

import "time"

type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Username  string    `json:"username" gorm:"unique"`
	Password  string    `json:"-"` // Don't return password in JSON
	CreatedAt time.Time `json:"created_at"`
}

type Transaction struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	Tanggal        string    `json:"tanggal"` // YYYY-MM-DD
	NoPolisi       string    `json:"no_polisi"`
	NamaPemilik    string    `json:"nama_pemilik"`
	JenisKendaraan string    `json:"jenis_kendaraan"`
	Harga          float64   `json:"harga"`
	Petugas        string    `json:"petugas"`
	CreatedAt      time.Time `json:"created_at"`
}

type Expense struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Tanggal     string    `json:"tanggal"` // YYYY-MM-DD
	Keterangan  string    `json:"keterangan"`
	Jumlah      float64   `json:"jumlah"`
	CreatedAt   time.Time `json:"created_at"`
}

type Petugas struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Nama      string    `json:"nama"`
	Aktif     int       `json:"aktif" gorm:"default:1"`
	CreatedAt time.Time `json:"created_at"`
}

func (Petugas) TableName() string {
	return "petugases"
}
