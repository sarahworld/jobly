const { sqlForPartialUpdate } = require('./sql');
const { BadRequestError } = require("../expressError");
const Test = require('supertest/lib/test');


describe('sqlRorPartialUpdate', () => {
    test('should generate correct SQL query fragment and values', () => {
        const dataToUpdate = { firstName: 'Aliya', age:32};
        const jsToSql = { firstName: 'first_name'};

        const result = sqlForPartialUpdate(dataToUpdate, jsToSql)

        expect(result).toEqual({
            setCols: '"first_name"=$1, "age"=$2',
            values: ['Aliya', 32]
        });
    })
})