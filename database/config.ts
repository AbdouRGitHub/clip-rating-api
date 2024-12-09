import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import 'dotenv/config';

const configService = new ConfigService();

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/database/migrations/*{.ts,.js}'],
  autoLoadEntities: true,
  synchronize: false,
  logging: true,
};

export const dataSource: DataSource = new DataSource(
  databaseConfig as DataSourceOptions,
);
