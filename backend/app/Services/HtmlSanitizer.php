<?php

namespace App\Services;

use DOMDocument;
use DOMElement;
use DOMNode;

class HtmlSanitizer
{
    private const ALLOWED_TAGS = [
        'p', 'br', 'h2', 'h3', 'h4',
        'strong', 'b', 'em', 'i', 'u', 's',
        'ul', 'ol', 'li', 'blockquote',
        'a', 'img', 'figure', 'figcaption',
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
        'hr', 'code', 'pre',
    ];

    private const ALLOWED_ATTRS = [
        'a' => ['href', 'title', 'target', 'rel'],
        'img' => ['src', 'alt', 'title', 'width', 'height', 'loading'],
        'th' => ['colspan', 'rowspan'],
        'td' => ['colspan', 'rowspan'],
    ];

    public static function sanitize(?string $html): string
    {
        if ($html === null || trim($html) === '') {
            return '';
        }

        $doc = new DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);
        $wrapped = '<!DOCTYPE html><html><body><div>' . mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8') . '</div></body></html>';
        $doc->loadHTML($wrapped, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $body = $doc->getElementsByTagName('body')->item(0);
        if (!$body || !$body->firstChild) {
            return '';
        }

        $container = $body->firstChild;
        self::cleanNode($container);

        $output = '';
        foreach ($container->childNodes as $child) {
            $output .= $doc->saveHTML($child);
        }

        return trim($output);
    }

    private static function cleanNode(DOMNode $node): void
    {
        $children = [];
        foreach ($node->childNodes as $child) {
            $children[] = $child;
        }

        foreach ($children as $child) {
            if ($child instanceof DOMElement) {
                $tag = strtolower($child->tagName);

                if (in_array($tag, ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'svg'], true)) {
                    $node->removeChild($child);
                    continue;
                }

                if (!in_array($tag, self::ALLOWED_TAGS, true)) {
                    self::cleanNode($child);
                    while ($child->firstChild) {
                        $node->insertBefore($child->firstChild, $child);
                    }
                    $node->removeChild($child);
                    continue;
                }

                $allowed = self::ALLOWED_ATTRS[$tag] ?? [];
                $attrsToRemove = [];
                foreach ($child->attributes as $attr) {
                    $name = strtolower($attr->name);
                    if (!in_array($name, $allowed, true)) {
                        $attrsToRemove[] = $attr->name;
                        continue;
                    }
                    if (in_array($name, ['href', 'src'], true)) {
                        $val = trim($attr->value);
                        if (!self::isSafeUrl($val)) {
                            $attrsToRemove[] = $attr->name;
                        }
                    }
                }
                foreach ($attrsToRemove as $attrName) {
                    $child->removeAttribute($attrName);
                }

                if ($tag === 'a' && $child->getAttribute('target') === '_blank') {
                    $child->setAttribute('rel', 'noopener noreferrer nofollow');
                }

                self::cleanNode($child);
            }
        }
    }

    private static function isSafeUrl(string $url): bool
    {
        if ($url === '' || str_starts_with($url, '/') || str_starts_with($url, '#')) {
            return true;
        }
        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));

        return in_array($scheme, ['http', 'https', 'mailto'], true);
    }

    public static function toPlainText(?string $html): string
    {
        if (!$html) {
            return '';
        }
        $text = html_entity_decode(strip_tags(str_replace(['</p>', '<br>', '<br/>', '</li>', '</h2>', '</h3>', '</h4>'], ' ', $html)), ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return trim(preg_replace('/\s+/', ' ', $text) ?? '');
    }

    public static function calculateReadingTime(?string $plainText): int
    {
        if (!$plainText) {
            return 1;
        }
        $words = str_word_count($plainText);

        return max(1, (int) ceil($words / 200));
    }
}

