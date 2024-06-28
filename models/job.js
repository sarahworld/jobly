"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
 /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity }
   *
   * Returns { title, salary, equity }
   *
   * Throws BadRequestError if job already in database.
   * */

    static async create({ data }){
        const result = await db.query(
            `INSERT INTO jobs (
            title,
            salary,
            equity,
            company_handle
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary,equity,
            company_handle AS "companyHandle )`,
            [
                data.title, 
                data.salary,
                data.equity,
                data.company_handle
            ]);
        let job = result.row[0]
        return job;
    }

    static async findAll(searchFilters = {}){
        const query = `SELECT title,
                        salary,
                        equity,
                        company_handle
                        FROM companies
                        ORDER BY name`;

        let whereExpressions = [];
        let queryValues = [];
                    
        const { title, minSalary, hasEquity} = searchFilters;

        if(title){
            queryValues.push(`%${title}%`)
            whereExpressions.push(`title ILIKE $${queryValues.length}`)
        }

        if(minSalary !== undefined){
            queryValues.push(minSalary);
            whereExpressions.push(`salary >= $${queryValues.length}`); 
        }

        if (hasEquity === true) {
            whereExpressions.push(`equity > 0`);
          }

        if (whereExpressions.length > 0) {
        query += " WHERE " + whereExpressions.join(" AND ");
        }

        query += "WHERE" + whereExpressions.join(" AND ");

        query += " ORDER BY title";
        const jobsRes = await db.query(query, queryValues);
        return jobsRes.rows;
    }

    static async get(id) {
        const jobRes = await db.query(
              `SELECT id,
                      title,
                      salary,
                      equity,
                      company_handle AS "companyHandle"
               FROM jobs
               WHERE id = $1`, [id]);
    
        const job = jobRes.rows[0];
    
        if (!job) throw new NotFoundError(`No job: ${id}`);
    
        const companiesRes = await db.query(
              `SELECT handle,
                      name,
                      description,
                      num_employees AS "numEmployees",
                      logo_url AS "logoUrl"
               FROM companies
               WHERE handle = $1`, [job.companyHandle]);
    
        delete job.companyHandle;
        job.company = companiesRes.rows[0];
    
        return job;
      }
      static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {});
        const idVarIdx = "$" + (values.length + 1);
    
        const querySql = `UPDATE jobs 
                          SET ${setCols} 
                          WHERE id = ${idVarIdx} 
                          RETURNING id, 
                                    title, 
                                    salary, 
                                    equity,
                                    company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];
    
        if (!job) throw new NotFoundError(`No job: ${id}`);
    
        return job;
      }
    
      /** Delete given job from database; returns undefined.
       *
       * Throws NotFoundError if company not found.
       **/
    
      static async remove(id) {
        const result = await db.query(
              `DELETE
               FROM jobs
               WHERE id = $1
               RETURNING id`, [id]);
        const job = result.rows[0];
    
        if (!job) throw new NotFoundError(`No job: ${id}`);
      }
    


}

module.exports = Job;