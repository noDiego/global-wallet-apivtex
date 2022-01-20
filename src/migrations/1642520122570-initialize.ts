import { MigrationInterface, QueryRunner } from 'typeorm';

export class initialize1622520122570 implements MigrationInterface {
  name = 'initialize1622520122570';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS \`commerce\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`token\` varchar(255) NOT NULL, \`code\` varchar(255) NOT NULL, \`enabled\` tinyint NOT NULL DEFAULT 1, \`isvtex\` tinyint NOT NULL DEFAULT 0, \`vtexAppToken\` varchar(255) NULL, \`vtexAppKey\` varchar(255) NULL, UNIQUE INDEX \`IDX_a116be413f155ac903a7258912\` (\`token\`), UNIQUE INDEX \`IDX_cb71bfa72a0f62f847155909a5\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`vtex_transaction_flow\` (\`id\` int NOT NULL AUTO_INCREMENT, \`date\` datetime NOT NULL, \`paymentId\` varchar(255) NOT NULL, \`operationType\` varchar(255) NOT NULL, \`amount\` int NOT NULL, \`authorizationId\` varchar(255) NULL, \`settleId\` varchar(255) NULL, \`requestId\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`vtex_wallet_payment\` (\`coreId\` varchar(255) NOT NULL, \`date\` datetime NOT NULL, \`paymentId\` varchar(255) NOT NULL, \`authorizationId\` varchar(255) NOT NULL, \`amount\` int NOT NULL, \`operationType\` varchar(255) NOT NULL, PRIMARY KEY (\`coreId\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`vtex_payment\` (\`id\` int NOT NULL AUTO_INCREMENT, \`paymentId\` varchar(255) NOT NULL, \`date\` datetime NOT NULL, \`status\` varchar(255) NULL, \`amount\` int NOT NULL, \`originalAmount\` int NOT NULL, \`orderId\` varchar(255) NULL, \`authorizationId\` varchar(255) NULL, \`merchantName\` varchar(255) NULL, \`commerceId\` int NULL, \`clientEmail\` varchar(255) NULL, \`callbackUrl\` varchar(255) NULL, UNIQUE INDEX \`IDX_0bd3ab34d3d5bbed8b0f6f8f3e\` (\`paymentId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`vtex_record\` (\`id\` int NOT NULL AUTO_INCREMENT, \`paymentId\` varchar(255) NOT NULL, \`operationType\` varchar(255) NOT NULL, \`requestHeaders\` longtext NULL, \`requestData\` longtext NOT NULL, \`responseData\` longtext NULL, \`date\` datetime NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`vtex_transaction_flow\` ADD CONSTRAINT \`FK_5e052796aeef8d3fb0cd2468fb6\` FOREIGN KEY (\`paymentId\`) REFERENCES \`vtex_payment\`(\`paymentId\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`vtex_wallet_payment\` ADD CONSTRAINT \`FK_ce9487e0605b7fae7c475c5955d\` FOREIGN KEY (\`paymentId\`) REFERENCES \`vtex_payment\`(\`paymentId\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`vtex_payment\` ADD CONSTRAINT \`FK_c8085fe8397ec699f3b812c09f7\` FOREIGN KEY (\`commerceId\`) REFERENCES \`commerce\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`vtex_payment\` DROP FOREIGN KEY \`FK_c8085fe8397ec699f3b812c09f7\``);
    await queryRunner.query(`ALTER TABLE \`vtex_wallet_payment\` DROP FOREIGN KEY \`FK_ce9487e0605b7fae7c475c5955d\``);
    await queryRunner.query(
      `ALTER TABLE \`vtex_transaction_flow\` DROP FOREIGN KEY \`FK_5e052796aeef8d3fb0cd2468fb6\``,
    );
    await queryRunner.query(`DROP TABLE \`vtex_record\``);
    await queryRunner.query(`DROP INDEX \`IDX_0bd3ab34d3d5bbed8b0f6f8f3e\` ON \`vtex_payment\``);
    await queryRunner.query(`DROP TABLE \`vtex_payment\``);
    await queryRunner.query(`DROP TABLE \`vtex_wallet_payment\``);
    await queryRunner.query(`DROP TABLE \`vtex_transaction_flow\``);
    // await queryRunner.query(`DROP INDEX \`IDX_cb71bfa72a0f62f847155909a5\` ON \`commerce\``);
    // await queryRunner.query(`DROP INDEX \`IDX_a116be413f155ac903a7258912\` ON \`commerce\``);
    // await queryRunner.query(`DROP TABLE \`commerce\``);
  }
}
