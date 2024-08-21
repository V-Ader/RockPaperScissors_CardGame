package utils

import (
	"fmt"
	"math/rand"
	"strings"
)

func GenerateId() string {
	return GenerateSizedId(4)
}

func GenerateSizedId(size int) string {
	var parts []string
	for i := 0; i < 4; i++ {
		parts = append(parts, fmt.Sprintf("%04d", rand.Int()%10000))
	}
	return strings.Join(parts, "-")
}
