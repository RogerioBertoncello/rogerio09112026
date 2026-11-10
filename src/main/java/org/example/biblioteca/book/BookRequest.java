package org.example.biblioteca.book;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record BookRequest(
        @NotBlank(message = "O título é obrigatório.")
        @Size(max = 160, message = "O título deve ter no máximo 160 caracteres.")
        String title,

        @NotBlank(message = "O autor é obrigatório.")
        @Size(max = 120, message = "O autor deve ter no máximo 120 caracteres.")
        String author,

        @NotBlank(message = "O ISBN é obrigatório.")
        @Pattern(regexp = "(?:[0-9]{9}[0-9Xx]|97[89][0-9]{10})",
                message = "Informe um ISBN-10 ou ISBN-13 válido, sem espaços ou hífens.")
        String isbn,

        @Min(value = 1000, message = "O ano de publicação deve ser maior ou igual a 1000.")
        @Max(value = 2100, message = "O ano de publicação não pode ser maior que 2100.")
        Integer publicationYear,

        @Size(max = 80, message = "O gênero deve ter no máximo 80 caracteres.")
        String genre,

        @Size(max = 1000, message = "A descrição deve ter no máximo 1000 caracteres.")
        String description
) {
}
