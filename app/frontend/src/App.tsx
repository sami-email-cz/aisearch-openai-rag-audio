import { useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { GroundingFiles } from "@/components/ui/grounding-files";
import GroundingFileView from "@/components/ui/grounding-file-view";
import StatusMessage from "@/components/ui/status-message";

import useRealTime from "@/hooks/useRealtime";
import useAudioRecorder from "@/hooks/useAudioRecorder";
import useAudioPlayer from "@/hooks/useAudioPlayer";

import { GroundingFile, ToolResult } from "./types";
import HistoryPanel from "@/components/ui/history-panel";

import logo from "./assets/logo.svg";

function App() {
    const [isRecording, setIsRecording] = useState(false);
    const [groundingFiles, setGroundingFiles] = useState<GroundingFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<GroundingFile | null>(null);

    const { startSession, addUserAudio, inputAudioBufferClear } = useRealTime({
        onWebSocketOpen: () => console.log("WebSocket connection opened"),
        onWebSocketClose: () => console.log("WebSocket connection closed"),
        onWebSocketError: event => console.error("WebSocket error:", event),
        onReceivedError: message => console.error("error", message),
        onReceivedResponseAudioDelta: message => {
            isRecording && playAudio(message.delta);
        },
        onReceivedInputAudioBufferSpeechStarted: () => {
            stopAudioPlayer();
        },
        onReceivedExtensionMiddleTierToolResponse: message => {
            const result: ToolResult = JSON.parse(message.tool_result);

            const files: GroundingFile[] = result.sources.map(x => {
                return { id: x.chunk_id, name: x.title, content: x.chunk };
            });

            setGroundingFiles(prev => [...prev, ...files]);
        }
    });

    const { reset: resetAudioPlayer, play: playAudio, stop: stopAudioPlayer } = useAudioPlayer();
    const { start: startAudioRecording, stop: stopAudioRecording } = useAudioRecorder({ onAudioRecorded: addUserAudio });

    const onToggleListening = async () => {
        if (!isRecording) {
            startSession();
            await startAudioRecording();
            resetAudioPlayer();

            setIsRecording(true);
        } else {
            await stopAudioRecording();
            stopAudioPlayer();
            inputAudioBufferClear();

            setIsRecording(false);
        }
    };

    const { t } = useTranslation();

    return (
        <div className="flex min-h-screen flex-col bg-gray-100 text-gray-900">
            <div className="p-4 sm:absolute sm:left-4 sm:top-4">
                <img src={logo} alt="Azure logo" className="h-16 w-16" />
            </div>
            <br />
            <br />
            <br />
            <main className="flex flex-grow flex-col items-center justify-center">
                <h1 className="mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-4xl font-bold text-transparent md:text-7xl">
                    {t("app.title")}
                </h1>
                <div className="mb-4 flex flex-col items-center justify-center">
                    <Button
                        onClick={onToggleListening}
                        className={`h-12 w-60 ${isRecording ? "bg-red-600 hover:bg-red-700" : "bg-purple-500 hover:bg-purple-600"}`}
                        aria-label={isRecording ? t("app.stopRecording") : t("app.startRecording")}
                    >
                        {isRecording ? (
                            <>
                                <MicOff className="mr-2 h-4 w-4" />
                                {t("app.stopConversation")}
                            </>
                        ) : (
                            <>
                                <Mic className="mr-2 h-6 w-6" />
                            </>
                        )}
                    </Button>
                    <StatusMessage isRecording={isRecording} />
                </div>
                <GroundingFiles files={groundingFiles} onSelected={setSelectedFile} />
                <HistoryPanel show={false} history={[]} onClosed={() => {}} onSelectedGroundingFile={() => {}} />
                <div className="mt-4 flex items-center justify-center">
                    <p className="text-sm text-gray-500">
                        {" "}
                        <h3>Ukazkove otazky ze znalostni baze</h3> <br />
                        Jaký nabízí hotel věrnostní program
                        <br />
                        Navrhni nějaké aktivity v okolí
                        <br />
                        Jaké apartmány hotel nabízí
                        <br />
                        Jaké jsou kontakty do hotelu
                        <br />
                        Jáké vybavení je v apartmánu
                        <br />
                        Jaké jsou možnosti pro firemní akce v hotelu
                        <br />
                        Jaké jsou možnosti parkování v hotelu
                        <br />
                        řekni mi informace o snídani a polopenzi
                    </p>
                </div>
                <div className="mt-4 flex items-center justify-center">
                    <p className="text-sm text-gray-500">
                        {" "}
                        <h2>system prompt</h2> [Identita] Jste Bea, mladá, veselá žena, která se ráda setkává s lidmi a má velkou radost ze své práce oddané
                        hotelové recepční. Vaše role zahrnuje řízení komunikace s hosty a včasné a efektivní řešení jejich požadavků. Bea mluví česky a odpovídá
                        an dotazy česky. <br />
                        [Znalostní báze] <br />
                        Na otázky odpovídejte pouze na základě informací, které jste vyhledali ve znalostní bázi, přístupné pomocí nástroje 'search'. Uživatel
                        poslouchá odpovědi se zvukem, takže je super důležité, aby odpovědi byly co nejkratší, pokud je to možné, jedna věta. Nikdy nečtěte
                        nahlas názvy souborů, názvy zdrojů nebo klíče. K reakci vždy použijte následující pokyny krok za krokem: 1. Než odpovíte na otázku, vždy
                        použijte nástroj 'search' ke kontrole znalostní báze. 2. K nahlášení zdroje informací ze znalostní báze vždy používejte nástroj
                        'report_grounding'. 3. Vytvořte co nejkratší odpověď. Pokud odpověď není ve znalostní bázi, řekněte, že nevíte. 4. Pokud je odpověď ve
                        znalostní bázi, ale není dostatečně podrobná, požádejte uživatele o další otázku. [Styl]
                        <br />
                        Použijte teplý a přívětivý tón, aby se hosté cítili jako doma. Během interakcí si zachovejte profesionální vystupování. Mluvte jasně a
                        používejte zdvořilý jazyk a začleňte přirozené pauzy, aby to znělo lidštěji. <br />
                        [Pokyny pro odpovědi] <br />
                        Udržujte odpovědi stručné a zaměřené na potřeby hosta. Potvrďte všechny opakované informace kvůli přesnosti, zejména jména a data. V
                        případě potřeby používejte fonetický pravopis, abyste zajistili porozumění. <br />
                        [Úkol a cíle] <br />
                        Pozdravte hosta: "Vítejte v našem hotelu. Jak vám mohu dnes pomoci?" Identifikujte potřeby nebo požadavky hosta: Pokud se jedná o dotaz
                        na rezervaci, zeptejte se na podrobnosti pobytu: "Mohli byste prosím uvést data a typ pokoje, o který máte zájem?" Pokud se jedná o
                        servisní požadavek, zeptejte se na podrobnosti: "Mohl byste mi říct více o pomoci, kterou potřebujete?" Využijte rezervační systém ke
                        kontrole dostupnosti pokojů a přístupu k nástrojům potřebným pro správu služeb pro hosty. Nabídněte dostupné možnosti nebo řešení: Pro
                        rezervace: "Máme volné pokoje od [datum zahájení] do [datum ukončení]. Chcete si jeden zarezervovat?" Pro služby: "Zařídím, aby
                        [požadovaná služba] byla poskytnuta co nejdříve." Potvrďte výběr nebo uspořádání hosta a zopakujte podrobnosti: "Zarezervoval jsem si
                        [typ pokoje] od [datum zahájení] do [datum ukončení]. Je to správně?" Podle potřeby uveďte informace o vybavení hotelu, místních
                        zajímavostech nebo možnostech stravování: "Chcete během svého pobytu doporučit restaurace nebo místní atrakce?" Pomozte s přepravou nebo
                        požadavky na rezervaci, jako je rezervace taxi nebo zajištění stolu v restauraci. Ukončete interakci: "Můžu vám dnes ještě s něčím
                        pomoci?" <br />
                        [Ošetření chyb / Záloha]
                        <br />
                        Pokud je požadavek hosta nejasný, položte upřesňující otázky: "Mohl byste prosím poskytnout více podrobností, abych vám mohl lépe
                        pomoci?" V případě nedostupných možností uveďte alternativy: "Tato možnost bohužel není k dispozici, ale mohu vám nabídnout
                        [alternativní řešení]." Omluvte se za jakékoli nepříjemnosti a zajistěte následné kroky: "Omlouvám se za případné nepříjemnosti. Budu
                        navazovat [nezbytné opatření]." Především se ujistěte, že každá interakce s hostem zanechá pozitivní dojem a splní jejich očekávání
                        ohledně služeb a pohostinnosti.
                        <br />
                    </p>
                </div>
            </main>

            <footer className="py-4 text-center">
                <p>{t("app.footer")}</p>
            </footer>

            <GroundingFileView groundingFile={selectedFile} onClosed={() => setSelectedFile(null)} />
        </div>
    );
}

export default App;
