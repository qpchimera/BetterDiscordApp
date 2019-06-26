import {Config} from "data";
import {React, WebpackModules, Patcher, ReactComponents, Utilities, Settings} from "modules";

import ContentList from "./settings/contentlist";
import SettingsGroup from "./settings/group";
import SettingsTitle from "./settings/title";

export default new class SettingsRenderer {

    constructor() {
        this.patchSections();
    }

    buildSettingsPanel(title, config, state, onChange, button = null) {
        config.forEach(section => {
            section.settings.forEach(item => item.value = state[section.id][item.id]);
        });
        return this.getSettingsPanel(title, config, onChange, button);
    }

    getSettingsPanel(title, groups, onChange, button = null) {
        return [React.createElement(SettingsTitle, {text: title, button: button}), groups.map(section => {
            return React.createElement(SettingsGroup, Object.assign({}, section, {onChange}));
        })];
    }

    getContentPanel(title, contentList, contentState, options = {}) {
        return React.createElement(ContentList, Object.assign({}, {
            title: title,
            contentList: contentList,
            contentState: contentState
        }, options));
    }

    get attribution() {
        return React.createElement("div", {className: "bd-version", style: {fontSize: "12px", fontWeight: "600", color: "#72767d", padding: "2px 10px"}},
            `BBD v${Config.bbdVersion} by `,
            React.createElement("a", {href: "https://github.com/rauenzi/", target: "_blank"}, "Zerebos")
        );
    }

    async patchSections() {
        Patcher.after("SettingsManager", WebpackModules.getByDisplayName("FluxContainer(GuildSettings)").prototype, "render", (thisObject) => {
            thisObject._reactInternalFiber.return.return.return.return.return.return.memoizedProps.id = "guild-settings";
        });
        console.log("getting user settings")
        const UserSettings = await ReactComponents.get("UserSettings", m => m.prototype && m.prototype.generateSections);
        console.log("got 'em")
        Patcher.after("SettingsManager", UserSettings.prototype, "render", (thisObject) => {
            thisObject._reactInternalFiber.return.return.return.return.return.return.return.memoizedProps.id = "user-settings";
        });
        Patcher.after("SettingsManager", UserSettings.prototype, "generateSections", (thisObject, args, returnValue) => {
            let location = returnValue.findIndex(s => s.section.toLowerCase() == "linux") + 1;
            const insert = (section) => {
                returnValue.splice(location, 0, section);
                location++;
            };
            insert({section: "DIVIDER"});
            insert({section: "HEADER", label: "BandagedBD"});
            for (const collection of Settings.collections) {
                if (collection.disabled) continue;
                insert({
                    section: collection.name,
                    label: collection.name,
                    element: () => this.buildSettingsPanel(collection.name, collection.settings, Settings.state[collection.id], Settings.onSettingChange.bind(Settings, collection.id), collection.button ? collection.button : null)
                });
            }
            for (const panel of Settings.panels.sort((a,b) => a.order > b.order)) {
                if (panel.clickListener) panel.onClick = (event) => panel.clickListener(thisObject, event, returnValue);
                insert(panel);
            }
            insert({section: "CUSTOM", element: () => this.attribution});
        });
        this.forceUpdate();
    }

    forceUpdate() {
        const viewClass = WebpackModules.getByProps("standardSidebarView").standardSidebarView.split(" ")[0];
        const node = document.querySelector(`.${viewClass}`);
        Utilities.getReactInstance(node).return.return.return.return.return.return.stateNode.forceUpdate();
    }
};