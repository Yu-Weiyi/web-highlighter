import type HighlightRange from '@src/model/range';
import { DomNode, SelectedNode, SelectedNodeType, SplitType } from '@src/types';
import { addClass as addElementClass, hasClass, isHighlightWrapNode, removeAllClass } from '@src/util/dom';
import {
    CAMEL_DATASET_IDENTIFIER,
    CAMEL_DATASET_IDENTIFIER_EXTRA,
    DATASET_IDENTIFIER,
    DATASET_IDENTIFIER_EXTRA,
    DATASET_SPLIT_TYPE,
    getDefaultOptions,
    ID_DIVISION,
} from '../util/const';
import { unique } from '../util/tool';

/**
 * 支持的选择器类型
 *  - class: .title, .main-nav
 *  - id: #nav, #js-toggle-btn
 *  - tag: div, p, span
 */
const isMatchSelector = ($node: HTMLElement, selector: string): boolean => {
    if (!$node) {
        return false;
    }

    if (/^\./.test(selector)) {
        const className = selector.replace(/^\./, '');

        return $node && hasClass($node, className);
    } else if (/^#/.test(selector)) {
        const id = selector.replace(/^#/, '');

        return $node && $node.id === id;
    }

    const tagName = selector.toUpperCase();

    return $node && $node.tagName === tagName;
};

/**
 * If start node and end node is the same, don't need to tranvers the dom tree.
 */
const getNodesIfSameStartEnd = (
    $startNode: Text,
    startOffset: number,
    endOffset: number,
    exceptSelectors?: string[],
) => {
    let $element = $startNode as Node;

    const isExcepted = ($e: HTMLElement) => exceptSelectors?.some(s => isMatchSelector($e, s));

    while ($element) {
        if ($element.nodeType === 1 && isExcepted($element as HTMLElement)) {
            return [];
        }

        $element = $element.parentNode;
    }

    $startNode.splitText(startOffset);

    const passedNode = $startNode.nextSibling as Text;

    passedNode.splitText(endOffset - startOffset);

    return [
        {
            $node: passedNode,
            type: SelectedNodeType.text,
            splitType: SplitType.both,
        },
    ];
};

/**
 * get all the dom nodes between the start and end node
 */
export const getSelectedNodes = (
    $root: Document | HTMLElement,
    start: DomNode,
    end: DomNode,
    exceptSelectors: string[],
): SelectedNode[] => {
    const $startNode = start.$node;
    const $endNode = end.$node;
    const startOffset = start.offset;
    const endOffset = end.offset;

    // TODO TEST
    console.log('---=-==-==--=-=-====-=-=');
    console.log($startNode);
    console.log($endNode);

    // split current node when the start-node and end-node is the same
    if ($startNode === $endNode && $startNode instanceof Text) {
        return getNodesIfSameStartEnd($startNode, startOffset, endOffset, exceptSelectors);
    }

    const nodeStack: (ChildNode | Document | HTMLElement | Text)[] = [$root];
    const selectedNodes: SelectedNode[] = [];

    const isExcepted = ($e: HTMLElement) => exceptSelectors?.some(s => isMatchSelector($e, s));

    let withinSelectedRange = false;
    let curNode: Node = null;

    while ((curNode = nodeStack.pop())) {
        // do not traverse the excepted node
        if (isExcepted(curNode as HTMLElement)) {
            continue;
        }

        const children = curNode.childNodes;

        for (let i = children.length - 1; i >= 0; i--) {
            nodeStack.push(children[i]);
        }

        // only collect text nodes and selected element nodes
        // TODO refactor
        // FIXME left right problem
        if (curNode === $startNode) {
            // element node
            if (
                curNode.nodeType === 1 &&
                ((curNode as HTMLElement).classList.contains('MathJax_CHTML') ||
                    (curNode as HTMLElement).classList.contains('mjx-chtml') ||
                    (curNode as HTMLElement).classList.contains('MJXc-display'))
            ) {
                selectedNodes.push({
                    $node: curNode as HTMLElement,
                    type: SelectedNodeType.span,
                    splitType: SplitType.head,
                });
            }

            // If start node is not equation root but is in equation span element, add the root element into selected nodes.
            if (curNode.nodeType === 3 && (
                (curNode.parentElement as HTMLElement).classList.contains('MathJax') ||
                    (curNode.parentElement as HTMLElement).classList.contains('MJXc-display') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mjx-container') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mjx-math') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mjx-mrow') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mjx-mi') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mjx-mo') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mjx-mn') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mjx-msub') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mjx-msup') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mjx-msubsup') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mjx-mfrac') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mjx-mroot') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mjx-msqrt') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mjx-mstyle') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mjx-annotation') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mjx-semantics') ||
                    (curNode.parentElement as HTMLElement).classList.contains('math') ||
                    (curNode.parentElement as HTMLElement).classList.contains('semantics') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mrow') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mi') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mo') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mn') ||
                    (curNode.parentElement as HTMLElement).classList.contains('msub') ||
                    (curNode.parentElement as HTMLElement).classList.contains('msup') ||
                    (curNode.parentElement as HTMLElement).classList.contains('msubsup') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mfrac') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mroot') ||
                    (curNode.parentElement as HTMLElement).classList.contains('msqrt') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mstyle') ||
                    (curNode.parentElement as HTMLElement).classList.contains('annotation') ||
                    (curNode.parentElement as HTMLElement).classList.contains('mjx-char')
            )) {
                console.log('----=-=---==-=--=-=- search equation root:')
                let equationRootElement = curNode as HTMLElement;
                let equationRootElementFlag = false;
                while (true) {
                    if (curNode.parentElement == null || curNode.parentElement == undefined) {
                        equationRootElementFlag = false;
                        console.log('equationRootElementFlag = false;')
                        break;
                    }
                    equationRootElement = equationRootElement.parentElement as HTMLElement;
                    if (
                        (equationRootElement as HTMLElement).classList.contains('MathJax_CHTML') ||
                        (equationRootElement as HTMLElement).classList.contains('mjx-chtml') ||
                        (equationRootElement as HTMLElement).classList.contains('MJXc-display')
                    ) {
                        // found equation root element
                        equationRootElementFlag = true;
                        console.log('equationRootElementFlag = true;')
                        console.log(equationRootElement);
                        break;
                    }
                }
                if (equationRootElementFlag) {
                    selectedNodes.push({
                        $node: equationRootElement as HTMLElement,
                        type: SelectedNodeType.span,
                        splitType: SplitType.head,
                    });
                    // FIXME add all children elements
                    // let equationRootChildrenElements = [];
                    // equationRootElement.childNodes.forEach(el => {
                    //     equationRootChildrenElements.push(el);
                    // });
                    // let curChild = null;
                    // while ((curChild = equationRootChildrenElements.pop())) {
                    //     if (curChild.firstChild === curChild.lastChild && curChild.firstChild.nodeType === 3) {
                    //         continue;
                    //     }
                    //     curChild.childNodes.forEach(el => {
                    //         equationRootChildrenElements.push(el);
                    //     });
                    //     selectedNodes.push({
                    //         $node: curChild as HTMLElement,
                    //         type: SelectedNodeType.span,
                    //         splitType: SplitType.none,
                    //     });
                    // }
                }
            }

            // text node
            if (curNode.nodeType === 3) {
                (curNode as Text).splitText(startOffset);

                const node = curNode.nextSibling as Text;

                selectedNodes.push({
                    $node: node,
                    type: SelectedNodeType.text,
                    splitType: SplitType.head,
                });
            }

            // meet the start-node (begin to traverse)
            withinSelectedRange = true;
        } else if (curNode === $endNode) {
            // element node
            if (curNode.nodeType === 1 &&
                ((curNode as HTMLElement).classList.contains('MathJax_CHTML') ||
                    (curNode as HTMLElement).classList.contains('mjx-chtml') ||
                    (curNode as HTMLElement).classList.contains('MJXc-display'))
            ) {
                selectedNodes.push({
                    $node: curNode as HTMLElement,
                    type: SelectedNodeType.span,
                    splitType: SplitType.tail,
                });
            }
            // text node
            if (curNode.nodeType === 3) {
                const node = curNode as Text;

                node.splitText(endOffset);
                selectedNodes.push({
                    $node: node,
                    type: SelectedNodeType.text,
                    splitType: SplitType.tail,
                });
            }

            // meet the end-node
            break;
        }
        // handle text nodes between the range
        else if (withinSelectedRange) {
            // element node
            if (curNode.nodeType === 1 &&
                ((curNode as HTMLElement).classList.contains('MathJax_CHTML') ||
                    (curNode as HTMLElement).classList.contains('mjx-chtml') ||
                    (curNode as HTMLElement).classList.contains('MJXc-display')
                )

            ) {
                selectedNodes.push({
                    $node: curNode as HTMLElement,
                    type: SelectedNodeType.span,
                    splitType: SplitType.none,
                });
            }
            // text node
            if (curNode.nodeType === 3) {
                selectedNodes.push({
                    $node: curNode as Text,
                    type: SelectedNodeType.text,
                    splitType: SplitType.none,
                });
            }
        }
    }

    return selectedNodes;
};

const addClass = ($el: HTMLElement, className?: string[] | string): HTMLElement => {
    let classNames = Array.isArray(className) ? className : [className];

    classNames = classNames.length === 0 ? [getDefaultOptions().style.className] : classNames;
    classNames.forEach(c => {
        addElementClass($el, c);
    });

    return $el;
};

const isNodeEmpty = ($n: Node): boolean => !$n || !$n.textContent;

/**
 * Wrap a common wrapper.
 */
const wrapNewNode = (
    selected: SelectedNode,
    range: HighlightRange,
    className: string[] | string,
    wrapTag: string,
): HTMLElement => {
    const $wrap = document.createElement(wrapTag);

    addClass($wrap, className);

    $wrap.appendChild(selected.$node.cloneNode(false));
    selected.$node.parentNode.replaceChild($wrap, selected.$node);

    $wrap.setAttribute(`data-${DATASET_IDENTIFIER}`, range.id);
    $wrap.setAttribute(`data-${DATASET_SPLIT_TYPE}`, selected.splitType);
    $wrap.setAttribute(`data-${DATASET_IDENTIFIER_EXTRA}`, '');

    return $wrap;
};

/**
 * Split and wrapper each one.
 */
const wrapPartialNode = (
    selected: SelectedNode,
    range: HighlightRange,
    className: string[] | string,
    wrapTag: string,
): HTMLElement => {
    const $wrap: HTMLElement = document.createElement(wrapTag);

    const $parent = selected.$node.parentNode as HTMLElement;
    const $prev = selected.$node.previousSibling;
    const $next = selected.$node.nextSibling;
    const $fr = document.createDocumentFragment();
    const parentId = $parent.dataset[CAMEL_DATASET_IDENTIFIER];
    const parentExtraId = $parent.dataset[CAMEL_DATASET_IDENTIFIER_EXTRA];
    const extraInfo = parentExtraId ? parentId + ID_DIVISION + parentExtraId : parentId;

    $wrap.setAttribute(`data-${DATASET_IDENTIFIER}`, range.id);
    $wrap.setAttribute(`data-${DATASET_IDENTIFIER_EXTRA}`, extraInfo);
    $wrap.appendChild(selected.$node.cloneNode(false));

    let headSplit = false;
    let tailSplit = false;
    let splitType: SplitType;

    if ($prev) {
        const $span = $parent.cloneNode(false);

        $span.textContent = $prev.textContent;
        $fr.appendChild($span);
        headSplit = true;
    }

    const classNameList: string[] = [];

    if (Array.isArray(className)) {
        classNameList.push(...className);
    } else {
        classNameList.push(className);
    }

    addClass($wrap, unique(classNameList));
    $fr.appendChild($wrap);

    if ($next) {
        const $span = $parent.cloneNode(false);

        $span.textContent = $next.textContent;
        $fr.appendChild($span);
        tailSplit = true;
    }

    if (headSplit && tailSplit) {
        splitType = SplitType.both;
    } else if (headSplit) {
        splitType = SplitType.head;
    } else if (tailSplit) {
        splitType = SplitType.tail;
    } else {
        splitType = SplitType.none;
    }

    $wrap.setAttribute(`data-${DATASET_SPLIT_TYPE}`, splitType);
    $parent.parentNode.replaceChild($fr, $parent);

    return $wrap;
};

/**
 * Just update id info (no wrapper updated).
 */
const wrapOverlapNode = (selected: SelectedNode, range: HighlightRange, className: string[] | string): HTMLElement => {
    const $parent = selected.$node.parentNode as HTMLElement;
    const $wrap: HTMLElement = $parent;

    removeAllClass($wrap);
    addClass($wrap, className);

    const dataset = $parent.dataset;
    const formerId = dataset[CAMEL_DATASET_IDENTIFIER];

    dataset[CAMEL_DATASET_IDENTIFIER] = range.id;
    dataset[CAMEL_DATASET_IDENTIFIER_EXTRA] = dataset[CAMEL_DATASET_IDENTIFIER_EXTRA]
        ? formerId + ID_DIVISION + dataset[CAMEL_DATASET_IDENTIFIER_EXTRA]
        : formerId;

    return $wrap;
};

/**
 * wrap a dom node with highlight wrapper
 *
 * Because of supporting the highlight-overlapping,
 * Highlighter can't just wrap all nodes in a simple way.
 * There are three types:
 *  - wrapping a whole new node (without any wrapper)
 *  - wrapping part of the node
 *  - wrapping the whole wrapped node
 *  FIXME parent
 */
export const wrapHighlight = (
    selected: SelectedNode,
    range: HighlightRange,
    className: string[] | string,
    wrapTag: string,
): HTMLElement => {
    let $parent = selected.$node.parentNode as HTMLElement;
    const $prev = selected.$node.previousSibling;
    const $next = selected.$node.nextSibling;
    if (selected.type === SelectedNodeType.span) {
        // selected.type === SelectedNodeType.span => element only
        let node = selected.$node as HTMLElement;
        if (node.classList && (node.classList.contains("MathJax_CHTML") || node.classList.contains("mjx-chtml") || node.classList.contains("MJXc-display"))) {
            $parent = node
        }
        addClass($parent, className);
        addClass($parent, 'noteSign4Element');
        $parent.setAttribute(`data-${DATASET_IDENTIFIER}`, range.id);
        $parent.setAttribute(`data-${DATASET_SPLIT_TYPE}`, selected.splitType);
        $parent.setAttribute(`data-${DATASET_IDENTIFIER_EXTRA}`, '');
        return $parent;
    }
    // selected.type === SelectedNodeType.text => text only

    let $wrap: HTMLElement;

    // text node, not in a highlight wrapper -> should be wrapped in a highlight wrapper
    if (!isHighlightWrapNode($parent)) {
        $wrap = wrapNewNode(selected, range, className, wrapTag);
    }
    // text node, in a highlight wrap -> should split the existing highlight wrapper
    else if (isHighlightWrapNode($parent) && (!isNodeEmpty($prev) || !isNodeEmpty($next))) {
        $wrap = wrapPartialNode(selected, range, className, wrapTag);
    }
    // completely overlap (with a highlight wrap) -> only add extra id info
    else {
        $wrap = wrapOverlapNode(selected, range, className);
    }

    return $wrap;
};

/**
 * merge the adjacent text nodes
 * .normalize() API has some bugs in IE11
 */
export const normalizeSiblingText = ($s: Node, isNext = true) => {
    if (!$s || $s.nodeType !== 3) {
        return;
    }

    const $sibling = isNext ? $s.nextSibling : $s.previousSibling;

    if ($sibling.nodeType !== 3) {
        return;
    }

    const text = $sibling.nodeValue;

    $s.nodeValue = isNext ? $s.nodeValue + text : text + $s.nodeValue;
    $sibling.parentNode.removeChild($sibling);
};
