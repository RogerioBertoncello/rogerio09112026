# Acervo — sistema de biblioteca

Aplicação web e API REST para cadastrar, consultar, atualizar e excluir livros. O backend usa Java 17, Spring Boot, Spring Web, Spring Data JPA, Bean Validation e MySQL. A interface está em `src/main/resources/static` e é servida pelo próprio backend.

## Executar

1. Instale Java 17 ou superior, Maven 3.6+ e MySQL 8.
2. Crie o banco `biblioteca` no MySQL (ou permita ao usuário configurado criá-lo).
3. Na raiz do projeto, configure as credenciais e execute:

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "sua-senha"
mvn spring-boot:run
```

Abra `http://localhost:8080`. A URL, usuário e senha do banco podem ser configurados com `DB_URL`, `DB_USERNAME` e `DB_PASSWORD`. A URL padrão do banco é `jdbc:mysql://localhost:3306/biblioteca`.

Para permitir um frontend servido em outra origem, configure `CORS_ALLOWED_ORIGINS` com uma lista de origens separadas por vírgula. Por padrão são permitidos `http://localhost:3000`, `http://localhost:5173` e `http://127.0.0.1:5500`.

## API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/books` | Lista livros; filtros opcionais `title`, `author` e `isbn` |
| GET | `/api/books/{id}` | Busca um livro pelo ID |
| POST | `/api/books` | Cadastra um livro |
| PUT | `/api/books/{id}` | Atualiza todos os dados de um livro |
| DELETE | `/api/books/{id}` | Exclui um livro |

Exemplo de corpo para POST e PUT:

```json
{
  "title": "O pequeno príncipe",
  "author": "Antoine de Saint-Exupéry",
  "isbn": "9780156012195",
  "publicationYear": 1943,
  "genre": "Ficção",
  "description": "Uma história sobre amizade."
}
```

Título, autor e ISBN são obrigatórios. O ISBN deve ser informado sem espaços ou hífens como ISBN-10 ou ISBN-13. Dados inválidos retornam HTTP 400, livro ou ID inexistente retorna 404 e ISBN duplicado retorna 409, em um corpo JSON com `status`, `message` e `details`. A interface permite buscar por ID para que a resposta 404 da API seja exibida; a validação dos formulários também é enviada à API para mostrar suas mensagens 400.

As buscas usam critérios do Spring Data JPA com parâmetros vinculados; nenhum valor recebido na requisição é concatenado em SQL.
