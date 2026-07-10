# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# path-resolution
- Resolve file paths relative to the package directory (not cwd), following the _find_env_file() pattern in config.py. Confidence: 0.75

# vietnamese-nlp
- For Vietnamese text matching, always include a diacritic-folded index (bỏ dấu) alongside the normalized index — Vietnamese users frequently type without diacritics and fuzzy matching alone won't compensate for complete diacritic loss. Confidence: 0.70

