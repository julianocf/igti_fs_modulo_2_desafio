import express from "express";
import { promises as fs } from "fs";

const { readFile, writeFile } = fs;

const router = express.Router();

// 1. Crie um endpoint para criar uma grade. Este endpoint deverá receber como parâmetros
// os campos student, subject, type e value conforme descritos acima. Esta grade deverá ser
// salva no arquivo json grades.json, e deverá ter um id único associado. No campo
// timestamp deverá ser salvo a data e hora do momento da inserção. O endpoint deverá
// retornar o objeto da grade que foi criada. A API deverá garantir o incremento automático
// deste identificador, de forma que ele não se repita entre os registros. Dentro do arquivo
// grades.json que foi fornecido para utilização no desafio o campo nextId já está com um
// valor definido. Após a inserção é preciso que esse nextId seja incrementado e salvo no
// próprio arquivo, de forma que na próxima inserção ele possa ser utilizado.
router.post("/", async (req, res, next) => {
    try {
        let grade = req.body;

        const data = JSON.parse(await readFile(global.fileName));

        grade = {
            id: data.nextId++,
            student: grade.student,
            subject: grade.subject,
            type: grade.type,
            value: grade.value,
            timestamp: new Date(),
        };

        data.grades.push(grade);

        await writeFile(global.fileName, JSON.stringify(data, null, 2));

        res.send(grade);

        global.logger.info(`POST /grade - ${JSON.stringify(grade)}`);
    } catch (err) {
        next(err);
    }
});

router.get("/", async (req, res, next) => {
    try {
        const data = JSON.parse(await readFile(global.fileName));
        res.send(data.grades);
        global.logger.info("GET /grade");
    } catch (err) {
        next(err);
    }
});

// 4. Crie um endpoint para consultar uma grade em específico. Este endpoint deverá
// receber como parâmetro o id da grade e retornar suas informações.
router.get("/:id", async (req, res, next) => {
    try {
        const data = JSON.parse(await readFile(global.fileName));
        const grade = data.grades.find(
            (grade) => grade.id === parseInt(req.params.id)
        );
        res.send(grade);
        global.logger.info("GET /grade/:id");
    } catch (err) {
        next(err);
    }
});

// 3. Crie um endpoint para excluir uma grade. Este endpoint deverá receber como
// parâmetro o id da grade e realizar sua exclusão do arquivo grades.json.
router.delete("/:id", async (req, res, next) => {
    try {
        const data = JSON.parse(await readFile(global.fileName));
        // retorna todos os registros menos o que será deletado
        data.grades = data.grades.filter(
            (grade) => grade.id !== parseInt(req.params.id)
        );
        await writeFile(global.fileName, JSON.stringify(data, null, 2));
        res.end();
        global.logger.info(`DELETE /grade/:id - ${req.params.id}`);
    } catch (err) {
        next(err);
    }
});

// 2. Crie um endpoint para atualizar uma grade. Este endpoint deverá receber como
// parâmetros o id da grade a ser alterada e os campos student, subject, type e value. O
// endpoint deverá validar se a grade informada existe, caso não exista deverá retornar um
// erro. Caso exista, o endpoint deverá atualizar as informações recebidas por parâmetros
// no registro, e realizar sua atualização com os novos dados alterados no arquivo
// grades.json.

router.put("/", async (req, res, next) => {
    try {
        let gradeToUpdate = req.body;

        if (!gradeToUpdate.id) {
            throw new Error("ID obrigatório!");
        }

        const data = JSON.parse(await readFile(global.fileName));
        const index = data.grades.findIndex(
            (grade) => grade.id === parseInt(gradeToUpdate.id)
        );

        if (index === -1) {
            throw new Error("Aluno não encontrado!");
        }

        data.grades[index].student = gradeToUpdate.student;
        data.grades[index].subject = gradeToUpdate.subject;
        data.grades[index].type = gradeToUpdate.type;
        data.grades[index].value = gradeToUpdate.value;

        await writeFile(global.fileName, JSON.stringify(data, null, 2));
        res.send(gradeToUpdate);

        global.logger.info(`PUT /grade - ${JSON.stringify(gradeToUpdate)}`);
    } catch (err) {
        next(err);
    }
});

router.patch("/update", async (req, res, next) => {
    try {
        let gradeToUpdate = req.body;

        if (!gradeToUpdate.id) {
            throw new Error("ID obrigatório!");
        }

        const data = JSON.parse(await readFile(global.fileName));
        const index = data.grades.findIndex(
            (grade) => grade.id === parseInt(gradeToUpdate.id)
        );

        if (index === -1) {
            throw new Error("Aluno não encontrado!");
        }

        data.grades[index].value = gradeToUpdate.value;
        await writeFile(global.fileName, JSON.stringify(data, null, 2));
        res.send(data.grades[index]);
        global.logger.info(
            `PATCH /update-grade - ${JSON.stringify(gradeToUpdate)}`
        );
    } catch (err) {
        next(err);
    }
});

// 5. Crie um endpoint para consultar a nota total de um aluno em uma disciplina. O
// endpoint deverá receber como parâmetro o student e o subject, e realizar a soma de
// todas os as notas de atividades correspondentes a aquele subject para aquele student. O
// endpoint deverá retornar a soma da propriedade value dos registros encontrados.
router.get("/student/:student/:subject", async (req, res, next) => {
    try {
        const data = JSON.parse(await readFile(global.fileName));
        const studentGrades = data.grades.filter((grade) => {
            return (
                grade.subject === req.params.subject &&
                grade.student === req.params.student
            );
        });
        const grade = studentGrades.reduce(
            (accumulator, current) => accumulator + current.value,
            0
        );

        res.send(
            `A nota do aluno ${req.params.student} em ${req.params.subject} é ${grade}`
        );
    } catch (err) {
        next(err);
    }
});

// 6. Crie um endpoint para consultar a média das grades de determinado subject e type. O
// endpoint deverá receber como parâmetro um subject e um type, e retornar a média. A
// média é calculada somando o registro value de todos os registros que possuem o subject
// e type informados, e dividindo pelo total de registros que possuem este mesmo subject e
// type.
router.get("/average/:subject/:type", async (req, res, next) => {
    try {
        const data = JSON.parse(await readFile(global.fileName));
        const filteredGrades = data.grades.filter((grade) => {
            return (
                grade.subject === req.params.subject &&
                grade.type === req.params.type
            );
        });
        const average =
            filteredGrades.reduce(
                (accumulator, current) => accumulator + current.value,
                0
            ) / filteredGrades.length;

        res.send(
            `A média das notas de ${req.params.subject} - ${req.params.type} é ${average}`
        );
    } catch (err) {
        next(err);
    }
});

// 7. Crie um endpoint para retornar as três melhores grades de acordo com determinado
// subject e type. O endpoint deve receber como parâmetro um subject e um type retornar
// um array com os três registros de maior value daquele subject e type. A ordem deve ser
// do maior para o menor.
router.get("/best/:subject/:type", async (req, res, next) => {
    try {
        const data = JSON.parse(await readFile(global.fileName));
        const filteredGrades = data.grades.filter((grade) => {
            return (
                grade.subject === req.params.subject &&
                grade.type === req.params.type
            );
        });
        filteredGrades.sort((a, b) => {
            return b.value - a.value;
        });
        res.send(filteredGrades.splice(0, 3));
    } catch (err) {
        next(err);
    }
});

router.get("/filter/:subject/:type", async (req, res, next) => {
    try {
        const data = JSON.parse(await readFile(global.fileName));
        const filteredGrades = data.grades.filter((grade) => {
            return (
                grade.subject === req.params.subject &&
                grade.type === req.params.type
            );
        });
        res.send(filteredGrades);
    } catch (err) {
        next(err);
    }
});

router.get("/filter-students/:student/:subject", async (req, res, next) => {
    try {
        const data = JSON.parse(await readFile(global.fileName));
        const studentGrades = data.grades.filter((grade) => {
            return (
                grade.subject === req.params.subject &&
                grade.student === req.params.student
            );
        });
        res.send(studentGrades);
    } catch (err) {
        next(err);
    }
});

// tratamento de erros genérico
router.use((err, req, res, next) => {
    global.logger.error(`${err.method} ${err.baseUrl} - ${err.message}`);
    res.status(400).send({ error: err.message });
});

export default router;
