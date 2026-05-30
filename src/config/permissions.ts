import { CommandPermission } from "./permissions/types";
import { TOWNY_PERMISSIONS } from "./permissions/towny";
import { FLECTONE_PERMISSIONS } from "./permissions/flectonepulse";

export const ALL_PERMISSIONS: Record<string, CommandPermission[]> = {
    flectonepulse: FLECTONE_PERMISSIONS,
    towny: TOWNY_PERMISSIONS,
};

export function getPermission(command: string): CommandPermission | undefined {
    const normalized = command.toLowerCase().trim();
    for (const group of Object.values(ALL_PERMISSIONS)) {
        const found = group.find((p) => p.command.toLowerCase() === normalized);
        if (found) return found;
    }
    return undefined;
}