import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	MarkdownRenderChild,
} from "obsidian";
import {
	StateEffect,
	StateField,
	EditorState,
	Transaction,
} from "@codemirror/state";
import { EditorView } from "@codemirror/view";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

const addEffect = StateEffect.define<number>();
const subtractEffect = StateEffect.define<number>();
const resetEffect = StateEffect.define();

export const calculatorField = StateField.define<number>({
	create(state: EditorState): number {
		return 0;
	},
	update(oldState: number, transaction: Transaction): number {
		let newState = oldState;

		for (const effect of transaction.effects) {
			if (effect.is(addEffect)) {
				newState += effect.value;
			} else if (effect.is(subtractEffect)) {
				newState -= effect.value;
			} else if (effect.is(resetEffect)) {
				newState = 0;
			}
		}

		return newState;
	},
});

export function add(view: EditorView, num: number) {
	view.dispatch({
		effects: [addEffect.of(num)],
	});
}

export function subtract(view: EditorView, num: number) {
	view.dispatch({
		effects: [subtractEffect.of(num)],
	});
}

export function reset(view: EditorView) {
	view.dispatch({
		effects: [resetEffect.of(null)],
	});
}

export class Emoji extends MarkdownRenderChild {
	static ALL_EMOJIS: Record<string, string> = {
		":+1:": "👍",
		":sunglasses:": "😎",
		":smile:": "😄",
	};

	text: string;

	constructor(containerEl: HTMLElement, text: string) {
		super(containerEl);

		this.text = text;
	}

	onload() {
		const emojiEl = this.containerEl.createSpan({
			text: Emoji.ALL_EMOJIS[this.text] ?? this.text,
		});
		this.containerEl.replaceWith(emojiEl);
	}
}

const hyphen = "-";
const enDash = "–";

const symbols = [
	".",
	"?",
	"!",
	",",
	"`",
	'"',
	"'",
	";",
	":",
	"/",
	"\\",
	"<",
	">",
	"[",
	"]",
	"{",
	"}",
	"(",
	")",
	"*",
	"&",
	"^",
	"%",
	"#",
	"@",
	"~",
	"_",
	"=",
	"+",
	"|",
	"—",
	"“",
	"”",
	"‘",
	"’",
	hyphen,
	enDash,
];

export function reverseString(aString: string) {
	return aString.split("").reverse().join("");
}

export function handleLeadingandTrailingSymbols(word: string) {
	const leadingSymbols = [];
	let remainingString = "";
	for (const letter of word) {
		if (symbols.includes(letter)) {
			leadingSymbols.push(letter);
		} else {
			remainingString = word.substring(word.indexOf(letter), word.length);
			break;
		}
	}
	const trailingSymbols = [];
	let reversedString = reverseString(remainingString);
	for (const letter of reversedString) {
		if (symbols.includes(letter)) {
			trailingSymbols.push(letter);
		} else {
			reversedString = reversedString.substring(
				reversedString.indexOf(letter),
				reversedString.length
			);
			break;
		}
	}
	remainingString = reverseString(reversedString);
	trailingSymbols.reverse();
	return { leadingSymbols, trailingSymbols, remainingString };
}

export function handleBolding(word: string) {
	if (word.length === 0) return "";
	if (word.length === 1) return `<strong>${word}</strong>`;
	if (word.length === 3)
		return `<strong>${word.substring(0, 1)}</strong><span>${word.substring(
			1,
			3
		)}</span>`;
	const halfwayIndex = Math.ceil(word.length / 2);
	return `<strong>${word.substring(
		0,
		halfwayIndex
	)}</strong><span>${word.substring(halfwayIndex, word.length)}</span>`;
}

export function makeBioReaderWord(word: string) {
	console.log("start");
	// remove any leading or trailing symbols (except dashes)
	const { leadingSymbols, trailingSymbols, remainingString } =
		handleLeadingandTrailingSymbols(word);
	console.log("remaining string: " + remainingString);
	const hasLeadingSymbols = leadingSymbols.length !== 0;
	const hasTrailingSymbols = trailingSymbols.length !== 0;
	//handle dashes
	const hasDashes =
		remainingString.includes(hyphen) || remainingString.includes(enDash);
	// handle email addresses
	const isEmailAddress = remainingString.includes("@");
	if (hasDashes) {
		//
		return "";
	} else if (isEmailAddress) {
		//
		return "";
	} else {
		const boldedWord = handleBolding(remainingString);
		let htmlToReturn = boldedWord;
		if (hasLeadingSymbols) {
			htmlToReturn =
				`<span>${leadingSymbols.join("")}</span>` + htmlToReturn;
		}
		if (hasTrailingSymbols) {
			htmlToReturn =
				htmlToReturn + `<span>${trailingSymbols.join("")}</span>`;
		}
		return htmlToReturn;
	}
}

export function makeBioReaderParagraph(wordArray: string[]) {
	const returnArray: string[] = [];
	wordArray.forEach((word) => {
		returnArray.push(makeBioReaderWord(word));
	});
	return returnArray;
}

export class BioReaderParagraph extends MarkdownRenderChild {
	wordArray: string[];

	constructor(containerEl: HTMLElement, wordArray: string[]) {
		super(containerEl);

		this.wordArray = wordArray;
	}

	onload() {
		const bioReaderElement = this.containerEl.createSpan();
		bioReaderElement.innerHTML = makeBioReaderParagraph(
			this.wordArray
		).join(" ");
		this.containerEl.replaceWith(bioReaderElement);
	}
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		this.registerMarkdownPostProcessor((element, context) => {
			console.log("start");
			console.log(element);
			const codeblocks = element.querySelectorAll("code");
			const paragraphs = element.querySelectorAll("p");
			console.log("paragraphs:");
			console.dir(paragraphs);
			paragraphs.forEach((paragraph) => {
				const text = paragraph.innerText.trim();
				console.log("text=" + text);
				const arrayOfText = text.split(" ");
				console.log("arrayOfText:");
				console.dir(arrayOfText);
				context.addChild(
					new BioReaderParagraph(paragraph, arrayOfText)
				);
			});
			codeblocks.forEach((codeblock) => {
				const text = codeblock.innerText.trim();
				const isEmoji =
					text[0] === ":" && text[text.length - 1] === ":";

				if (isEmoji) {
					context.addChild(new Emoji(codeblock, text));
				}
			});
		});
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Sample Plugin",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new Notice("This is a notice!");
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: () => {
				new SampleModal(this.app).open();
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection("Sample Editor Command");
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open sample modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Settings for my awesome plugin." });

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						console.log("Secret: " + value);
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
