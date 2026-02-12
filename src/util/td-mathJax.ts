
// 判断当前节点是否在数学公式中
import { SelectedNode, SelectedNodeType, SplitType } from '@src/types';

export default function isInMathJax(curNode: Node): Boolean  {
        // text
        return (curNode.nodeType === 3 &&
            ((curNode.parentElement as HTMLElement).classList.contains('MathJax') ||
                (curNode.parentElement as HTMLElement).classList.contains('MJXc-display') ||
                (curNode.parentElement as HTMLElement).classList.contains('mjx-container') ||
                (curNode.parentElement as HTMLElement).classList.contains('mjx-math') ||
                (curNode.parentElement as HTMLElement).classList.contains('mjx-char') ||
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
                (curNode.parentElement as HTMLElement).classList.contains('mjx-strut') ||
                (curNode.parentElement as HTMLElement).classList.contains('mjx-mtext') ||
                (curNode.parentElement as HTMLElement).classList.contains('MJXc-TeX-main-R') ||
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
                (curNode.parentElement as HTMLElement).classList.contains('annotation')
            )
        )
        ||
        // element
        (curNode.nodeType === 1 && (curNode as HTMLElement).classList.contains('mjx-strut'));
}


// 根据当前数学公式中某个节点，返回整个数学公式的根节点（需要isinMathJax先校验curNode）
export function getEquationRootElement(curNode: Node): HTMLElement  {

    let equationRootElement = curNode.parentNode as HTMLElement;
    while (true) {
        if (curNode.parentElement === null || curNode.parentElement === undefined) {
            console.log('equationRootElementFlag = false;');
            break;
        }
        if(
            (equationRootElement as HTMLElement).classList.contains('MathJax_CHTML') ||
            (equationRootElement as HTMLElement).classList.contains('mjx-chtml') ||
            (equationRootElement as HTMLElement).classList.contains('MJXc-display')
        ) {
            // found equation root element
            console.log(equationRootElement);
            break;
        }
        equationRootElement = equationRootElement.parentElement as HTMLElement;
    }

    return equationRootElement;
}

// 获取数学公式根节点的所有子节点
export function getAllRootChildrenNodeList(curNode: HTMLElement): SelectedNode[] {
    const tempStack: (ChildNode | Document | HTMLElement | Text)[] = [curNode];
    let curNode_1 : Node = null;
    const selectedNodeArray: SelectedNode[] = [];
    while(curNode_1 = tempStack.pop()){
        const children = curNode_1.childNodes;
        for (let i = children.length - 1; i >= 0; i--) {

            if (children[i].parentNode === null) {
                continue;
            }

            // if(children[i].nodeType === 1){
            tempStack.push(children[i]);
            // }
        }
        selectedNodeArray.push({
            $node: curNode_1 as HTMLElement,
            type: SelectedNodeType.span,
            splitType: SplitType.both,
        })
    }
    return selectedNodeArray;

}