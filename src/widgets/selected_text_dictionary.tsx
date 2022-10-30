import { usePlugin, useTracker, SelectionType, renderWidget } from '@remnote/plugin-sdk';
import React from 'react'

function cleanSelectedText(s?: string) {
  return s?.trim()?.split(/(\s+)/)[0]?.replaceAll(/[^a-zA-Z]/g, '')
}

export function useDebounce<T>(value: T, msDelay: number) {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, msDelay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, msDelay]);
  return debouncedValue;
}

function SelectedTextDictionary() {
  const plugin = usePlugin();
  const [wordData, setWordData] = React.useState<string>();

  const searchTerm = useDebounce(
    useTracker(async (reactivePlugin) => {
      const sel = await reactivePlugin.editor.getSelection();
      if (sel?.type == SelectionType.Text) {
        return await cleanSelectedText( await plugin.richText.toString(sel.richText));
      } else {
        return undefined;
      }
    }),
    500,
  )

  React.useEffect(() => {
    const getAndSetData = async () => {
      if(!searchTerm) {
        return;
      }
      try {
        const url = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
        const response = await fetch(url + searchTerm);
        const json = await response.json();
        setWordData(Array.isArray(json) ? json[0]: undefined)
      } catch(e) {
        console.log('Error getting dictionary info: ', e);
      }
    };

    getAndSetData();
  }, [searchTerm])

  return <pre>{JSON.stringify(wordData, null, 2)}</pre>;
}

renderWidget(SelectedTextDictionary);