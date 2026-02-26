import { XUIObject, XUI, XObjectPack } from "@xpell/ui";
import type { XUIObjectData, XObjectData } from "@xpell/ui";
import { XStack } from "./xstack";
import { XScroll } from "./xscroll";
import { XSpacer } from "./xspacer";
import { XDivider } from "./xdivider";
import { XToolbar } from "./xtoolbar";
import { XTable } from "./xtable";
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


import { XSection } from "./xsection";

export class XDashPack extends XObjectPack {
    static getObjects() {
        return {
            [XCard._xtype]:XCard, 
            [XGrid._xtype]:XGrid,
            [XNavList._xtype]:XNavList,
            [XBadge._xtype]:XBadge,
            [XTable._xtype]:XTable,
            [XModal._xtype]:XModal,
            [XToast._xtype]:XToast,
            [XDivider._xtype]:XDivider,
            [XStack._xtype]:XStack,
            [XKpiCard._xtype]:XKpiCard,
            [XScroll._xtype]:XScroll,
            [XSpacer._xtype]:XSpacer,
            [XToolbar._xtype]:XToolbar,
            [XEmptyState._xtype]:XEmptyState,
            [XInputGroup._xtype]:XInputGroup,
            [XSearchBox._xtype]:XSearchBox,
            [XSelect._xtype]:XSelect,
            [XField._xtype]:XField,
            [XDrawer._xtype]:XDrawer,
            [XSidebar._xtype]:XSidebar,
            [XSection._xtype]:XSection,
        }
    }
}
