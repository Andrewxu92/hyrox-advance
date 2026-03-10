declare module 'better-sqlite3' {
  class Database {
    constructor(path: string, options?: any);
    pragma(sql: string): any;
    close(): void;
    exec(sql: string): void;
    prepare(sql: string): any;
    transaction(fn: Function): Function;
  }
  export = Database;
}
