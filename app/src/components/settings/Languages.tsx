"use strict";

import * as React from 'react';

import conf from "configs/configurations";
import {SETTINGS_PANEL} from "configs/constants";
import components from "configs/localization";
import "scss/pages/left-panel/settings/Languages"
import {
    LanguageSettings, SepLine, SepLineLanguage,
    SettingsListBlock,
    SettingsListBlockContent,
    SettingsText,
    SettingsTitle
} from "containers/settings/style";
import Log from "modules/messages/Log";

interface ILanguagesProps {
    languages: any;
    handleLanguageChange: (event: React.MouseEvent<HTMLDivElement>) => void;
}

interface ILanguagesState {

}

export default class Languages extends React.Component<ILanguagesProps, ILanguagesState> {

    render() {

        const localization = components().languageSettings;
        const {languages, handleLanguageChange} = this.props;
        Log.i(languages, 'languages')
        Log.i(conf.app.languages, 'lang')
        return (
            <LanguageSettings>
                <SettingsListBlockContent>
                {conf.app.languages.map((language, i) => {
                    return (
                        <SettingsListBlock className="content" key={language.value}
                             data-name="selectedLanguage"
                             data-language={language.value}
                             data-path={SETTINGS_PANEL.languages}
                             onClick={handleLanguageChange}>
                            <div>
                                <SettingsTitle cursor="pointer">{localization[language.value]}</SettingsTitle>
                                <SettingsText textTransform="capitalize">{language.name}</SettingsText>
                            </div>

                            {language.value === languages.get('selectedLanguage') &&
                            <span className="language-active"/>}
                            { i !== conf.app.languages.length - 1 &&
                                <SepLineLanguage />
                            }
                        </SettingsListBlock>
                    )
                })}
                </SettingsListBlockContent>
            </LanguageSettings>
        );
    }
}


