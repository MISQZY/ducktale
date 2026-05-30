export type GlobalPermission = "all" | "old" | "supporter" | "admin";

export interface CommandPermission {
    command: string;
    permission: GlobalPermission;
    roles?: string[];
}