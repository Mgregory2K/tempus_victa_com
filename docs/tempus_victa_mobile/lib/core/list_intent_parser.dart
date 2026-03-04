class ListIntent {
  final String action; // create|add|remove|clear|show
  final String listName;
  final List<String> items;

  const ListIntent({required this.action, required this.listName, this.items = const []});
}

class ListIntentParser {
  static ListIntent? parse(String transcript) {
    final raw = transcript.trim();
    if (raw.isEmpty) return null;

    final lower = raw.toLowerCase();

    // 1. "Show/Open <list> list"
    // Fixed: Removed (?i) and use caseSensitive: false in RegExp constructor
    final showMatch = RegExp(r'^(?:show|open|go\s+to|look\s+at)\s+(.+?)(?:\s+list)?$', caseSensitive: false).firstMatch(lower);
    if (showMatch != null) {
      return ListIntent(action: 'show', listName: _titleize(showMatch.group(1)!));
    }

    // 2. Natural Language: "<list> list: <item>, <item>"
    final colonMatch = RegExp(r'^(.+?)(?:\s+list)?\s*:\s*(.+)$', caseSensitive: false).firstMatch(lower);
    if (colonMatch != null) {
        final name = _titleize(colonMatch.group(1)!);
        final items = _splitItems(colonMatch.group(2)!);
        return ListIntent(action: 'add', listName: name, items: items);
    }

    // 3. Natural Language: "Add <item> to <list> list"
    // Fixed: Removed (?i) and use caseSensitive: false
    final addMatch = RegExp(r'^(?:add|put|get)\s+(.+?)\s+(?:to|on|into)\s+(?:my\s+)?(.+?)(?:\s+list)?$', caseSensitive: false).firstMatch(lower);
    if (addMatch != null) {
        return ListIntent(
          action: 'add', 
          listName: _titleize(addMatch.group(2)!), 
          items: _splitItems(addMatch.group(1)!)
        );
    }

    // 4. Loose Match: "Grocery list <item>"
    // This handles "Grocery list apples" or "Milk to grocery list"
    if (lower.contains('list')) {
        final parts = lower.split('list');
        if (parts.length == 2) {
            final before = parts[0].trim();
            final after = parts[1].trim();
            
            // "Grocery list apples"
            if (before.isNotEmpty && after.isNotEmpty) {
                return ListIntent(action: 'add', listName: _titleize(before), items: _splitItems(after));
            }
            // "Apples to grocery list"
            if (before.isNotEmpty && before.contains(RegExp(r'\s+(?:to|on|into)\s+'))) {
                 final subParts = before.split(RegExp(r'\s+(?:to|on|into)\s+'));
                 return ListIntent(action: 'add', listName: _titleize(subParts.last), items: _splitItems(subParts.first));
            }
        }
    }

    return null;
  }

  static List<String> _splitItems(String s) {
    final raw = s.trim();
    if (raw.isEmpty) return const [];
    final parts = raw.split(RegExp(r'\s*,\s*|\s+and\s+'));
    return parts.map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
  }

  static String _titleize(String s) {
    final raw = s.trim();
    if (raw.isEmpty) return '';
    final words = raw.split(RegExp(r'\s+'));
    return words.map((w) => w.isNotEmpty ? w[0].toUpperCase() + w.substring(1) : '').join(' ').trim();
  }
}
