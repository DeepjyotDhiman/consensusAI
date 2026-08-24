declare class DatabaseWrapper {
    prepare<TParams extends any[] = any[], TResult = any>(sql: string): {
        run: (...args: any[]) => {
            changes: number;
            lastInsertRowid: number;
        };
        get: (...args: any[]) => TResult | undefined;
        all: (...args: any[]) => TResult[];
    };
    exec(sql: string): void;
    pragma(_sql: string): void;
}
declare const db: DatabaseWrapper;
export default db;
//# sourceMappingURL=db.d.ts.map