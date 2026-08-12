import type { XpellSkill } from "@xpell/ui";
import { XGALLERY_SKILL } from "./xgallery.skill";
import { XLIST_SKILL } from "./xlist.skill";
import { XTIMELINE_SKILL } from "./xtimeline.skill";
import { XCALENDAR_SKILL } from "./xcalendar.skill";
import { XKANBAN_SKILL } from "./xkanban.skill";
import { XSTATS_SKILL } from "./xstats.skill";

export type XDashboardSkillBindings = {
  _collection?: string[];
  [key: string]: string[] | undefined;
};

export type XDashboardDiscoverySkill = XpellSkill & {
  _category?: string;
  _purpose?: string;
  _aliases?: string[];
  _capabilities?: string[];
  _bindings?: XDashboardSkillBindings;
  _usage?: string[];
  _use_cases?: string[];
  _presentation?: {
    _kind?: string;
    _mode?: string;
    _alternatives?: string[];
    _prefer_when?: string[];
  };
};

const xdashboardObjectSkillSource: Record<string, XDashboardDiscoverySkill> = {
  [XGALLERY_SKILL._id]: XGALLERY_SKILL,
  [XLIST_SKILL._id]: XLIST_SKILL,
  [XTIMELINE_SKILL._id]: XTIMELINE_SKILL,
  [XCALENDAR_SKILL._id]: XCALENDAR_SKILL,
  [XKANBAN_SKILL._id]: XKANBAN_SKILL,
  [XSTATS_SKILL._id]: XSTATS_SKILL,
};

export function getXDashboardObjectSkills(): Record<string, XDashboardDiscoverySkill> {
  const skills: Record<string, XDashboardDiscoverySkill> = {};

  Object.entries(xdashboardObjectSkillSource).forEach(([type, skill]) => {
    skills[type] = {
      ...skill,
      _id: skill._id ?? type,
    };
  });

  return skills;
}

export function getXDashboardObjectSkillsByCategory(
  category: string
): Record<string, XDashboardDiscoverySkill> {
  const skills = getXDashboardObjectSkills();
  const filtered: Record<string, XDashboardDiscoverySkill> = {};

  Object.entries(skills).forEach(([type, skill]) => {
    if (skill._category === category) filtered[type] = skill;
  });

  return filtered;
}

export const XDashboardObjectSkills = getXDashboardObjectSkills();
