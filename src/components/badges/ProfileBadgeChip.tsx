

import { BadgeChip } from "@/components/badges/BadgeChip";
import { BadgeTooltipWrapper } from "./BadgeTooltipWrapper";

interface ProfileBadgeChipProps {
  name: string;
  icon: string;
  color: string | null;
  description: string | null;
  earnCondition: string | null;
}

/**
 * Wraps BadgeChip with a hover tooltip showing the badge's description and
 * (if set) how to earn it — profile-page-only context; the admin badges
 * list shows the same two fields as plain text instead, so it doesn't need
 * this wrapper.
 */
export function ProfileBadgeChip({ name, icon, color, description, earnCondition }: ProfileBadgeChipProps) {
  return (
    <BadgeTooltipWrapper name={name} description={description} earnCondition={earnCondition}>
      <BadgeChip name={name} icon={icon} color={color} />
    </BadgeTooltipWrapper>
  );
}
