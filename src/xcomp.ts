import { XUIObject, XUI, XObjectPack } from "@xpell/ui";
import type { XUIObjectData, XObjectData } from "@xpell/ui";
import { XStack } from "./xstack";
import { XScroll } from "./xscroll";
import { XSpacer } from "./xspacer";
import { XDivider } from "./xdivider";
import { XToolbar } from "./xtoolbar";
import { XTable } from "./xtable";
import { XList } from "./xlist";
import { XTimeline } from "./xtimeline";
import { XCalendar } from "./xcalendar";
import { XGallery } from "./xgallery";
import { XKanban } from "./xkanban";
import { XStats } from "./xstats";
import { XBadge } from "./xbadge";
import { XEmptyState } from "./xempty";
import { XSearchBox } from "./xsearch";
import { XInputGroup } from "./xigroup";
import { XSelect } from "./xselect";
import { XField } from "./xfield";
import { XDrawer } from "./xdrawer";
import { XNavList } from "./xnavlist";
import { XSidebar } from "./xsidebar";
import { XModal } from "./xmodal";
import { XToast } from "./xtoast";
import { XCard } from "./xcard";
import { XKpiCard } from "./xkpicard";
import { XGrid } from "./xgrid";
import { XDashboardSkillDesigns } from "./xdesign";


import { XSection } from "./xsection";

type XDashboardObjectClass = {
    _xtype: string;
    _skill?: {
        _design?: unknown;
        [key: string]: unknown;
    };
};

function attachSkillDesigns<T extends Record<string, XDashboardObjectClass>>(objects: T): T {
    Object.entries(objects).forEach(([type, objectClass]) => {
        const design = XDashboardSkillDesigns[type as keyof typeof XDashboardSkillDesigns];
        if (!design || !objectClass._skill) return;
        objectClass._skill = {
            ...objectClass._skill,
            _design: design,
        };
    });
    return objects;
}

export class XDashPack extends XObjectPack {
    static getObjects() {
        return attachSkillDesigns({
            [XCard._xtype]:XCard, 
            [XGrid._xtype]:XGrid,
            [XNavList._xtype]:XNavList,
            [XBadge._xtype]:XBadge,
            [XTable._xtype]:XTable,
            [XList._xtype]:XList,
            [XTimeline._xtype]:XTimeline,
            [XCalendar._xtype]:XCalendar,
            [XKanban._xtype]:XKanban,
            [XStats._xtype]:XStats,
            [XModal._xtype]:XModal,
            [XToast._xtype]:XToast,
            [XDivider._xtype]:XDivider,
            [XStack._xtype]:XStack,
            [XKpiCard._xtype]:XKpiCard,
            [XScroll._xtype]:XScroll,
            [XSpacer._xtype]:XSpacer,
            [XToolbar._xtype]:XToolbar,
            [XEmptyState._xtype]:XEmptyState,
            [XGallery._xtype]:XGallery,
            [XInputGroup._xtype]:XInputGroup,
            [XSearchBox._xtype]:XSearchBox,
            [XSelect._xtype]:XSelect,
            [XField._xtype]:XField,
            [XDrawer._xtype]:XDrawer,
            [XSidebar._xtype]:XSidebar,
            [XSection._xtype]:XSection,
        });
    }
}
