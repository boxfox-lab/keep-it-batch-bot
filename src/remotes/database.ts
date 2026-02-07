import { ConnectionOptions, DataSource } from 'typeorm';

export async function createDatabaseConnection(
  params: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl?: boolean;
    extra?: {
      ssl?: {
        rejectUnauthorized?: boolean;
      };
    };
  },
  entities: any,
) {
  const databaseConfig: ConnectionOptions = {
    type: 'postgres',
    synchronize: false,
    entities: entities,
    ssl: true,
    extra: {
      max: 10, // 커넥션 풀 크기 증가
      min: 2, // 최소 커넥션 수 설정
      idleTimeoutMillis: 30000, // 비활성 커넥션 유지 시간 (ms)
      connectionTimeoutMillis: 10000, // 커넥션 시도 timeout (ms) - 2초에서 10초로 증가
      acquireTimeoutMillis: 10000, // 커넥션 획득 timeout (ms)
      ssl: {
        rejectUnauthorized: false,
      },
    },
    ...params,
  };

  // 재시도 로직 추가
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const datasource = new DataSource(databaseConfig);
      const connection = await datasource.initialize();
      console.log(
        `데이터베이스 연결 성공: ${params.host}:${params.port}/${params.database}`,
      );
      return connection;
    } catch (error) {
      retryCount++;
      console.error(
        `데이터베이스 연결 실패 (시도 ${retryCount}/${maxRetries}):`,
        error.message,
      );

      if (retryCount >= maxRetries) {
        throw new Error(
          `데이터베이스 연결 실패: ${maxRetries}번 시도 후 포기. 마지막 에러: ${error.message}`,
        );
      }

      // 재시도 전 대기 (지수 백오프)
      const waitTime = Math.pow(2, retryCount) * 1000; // 2초, 4초, 8초...
      console.log(`${waitTime}ms 후 재시도...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}
