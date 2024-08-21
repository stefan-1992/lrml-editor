from lrml import parse_to_tree, node_to_lrml
from anytree import Node, findall
import re

def remove_duplicate_and_or_expr(lrml):
    tree = parse_to_tree(lrml)
    and_node = findall(tree, filter_=lambda x: (x.name == 'and' and x.parent.name == 'and') or (
        x.name == 'or' and x.parent.name == 'or') or (x.name == 'expr' and x.parent.name == 'expr' and len(x.siblings) == 0))
    while and_node:
        parent = and_node[0].parent
        and_node[0].parent = None
        for i in and_node[0].children:
            i.parent = parent
        parent.children = sorted(
            parent.children, key=lambda item: item.node_id)
        and_node = findall(tree, filter_=lambda x: (x.name == 'and' and x.parent.name == 'and') or (
            x.name == 'or' and x.parent.name == 'or') or (x.name == 'expr' and x.parent.name == 'expr' and len(x.siblings) == 0))
    return node_to_lrml(tree)


def sort_children(node):
    node.children = sorted(node.children, key=lambda item: item.node_id)


def remove_node(node):
    if node.parent is None:
        return
    parent = node.parent
    node.parent = None
    for i in node.children:
        i.parent = parent
    sort_children(parent)


def combine_rel_and_var(lrml):
    tree = parse_to_tree(lrml)
    expr_node = findall(tree, filter_=lambda x: (x.name == 'atom' in str(x)))

    for i in expr_node:
        if len(i.children) == 2 and i.children[0].name.strip() in ['rel', 'relation'] and i.children[1].name.strip() in ['var', 'variable']:
            new_name = i.children[1].children[0].name + \
                '.' + i.children[0].children[0].name
            i.children[1].parent = None
            i.children[0].name = new_name
            for j in i.children[0].children:
                j.parent = None
        elif len(i.children) == 1 and i.children[0].children:
            new_name = i.children[0].children[0].name
            i.children[0].name = new_name
            for j in i.children[0].children:
                j.parent = None
        else:
            print('Error: ', i.children)
    return node_to_lrml(tree)


def resolve_expressions(lrml):
    tree = parse_to_tree(lrml)
    expr_node = findall(tree, filter_=lambda x: (
        x.name.strip() in ['expr', 'expression']))
    for i in expr_node:
        funs = findall(i, maxlevel=2, filter_=lambda x: (
            x.name.strip() in ['fun', 'function']))
        if len(funs) != 1:
            if not i.children or not i.children[0].name == 'rulestatement':
                print('Error: ', i, i.children, funs, lrml)
        else:
            fun = funs[0].children[0]
            funs[0].parent = None
            fun.parent = i.parent
            i.parent = None
            for j in i.children:
                if len(j.children) == 1:
                    j.parent = None
                    j.children[0].node_id = j.node_id
                    j.children[0].parent = fun
                else:
                    j.parent = fun
            sort_children(fun.parent)
    return node_to_lrml(tree)


def resolve_loop(lrml):
    tree = parse_to_tree(lrml)
    expr_node = findall(tree, filter_=lambda x: (
        (x.name.strip() in ['expr', 'expression'])))
    for i in expr_node:
        if not len(i.children) == 2:
            print(i, i.children)
        else:
            for j in i.children:
                remove_node(j)
            i.name = 'loop'
    return node_to_lrml(tree)


abbr_mapping = {'metre': 'm', 'gram': 'g', 'litre': 'l', 'newton': 'N',
                'pascal': 'Pa', 'angleDegree': 'deg', 'celsius': 'degC', 'hectare': 'ha'}
abbr_mapping_prefixes = {'kilo': 'k', 'milli': 'm', 'mega': 'M'}
opperator_mapping = {'addition': '+', 'subtraction': '-',
                     'multiplication': '*', 'division': '/'}


def resolve_units(lrml):
    tree = parse_to_tree(lrml)
    unit_nodes = findall(tree, filter_=lambda x: (((x.name == 'baseunit') and (
        x.parent.name != 'derivedunit')) or (x.name == 'derivedunit')))

    for node in unit_nodes:
        if node.name == 'baseunit':
            unit = base_unit_to_abbr(node)
        else:
            unit = derived_unit_to_abbr(node)
        value_node = findall(
            node.parent, filter_=lambda x: (x.name == 'value'))[0]
        value = trim_decimal_point(value_node.leaves[0].name)
        Node(name=value + ' ' + unit, parent=node.parent)
        node.parent = None
        value_node.parent = None

    return node_to_lrml(tree)


def trim_decimal_point(number_string):
    return number_string[:-2] if number_string.endswith('.0') else number_string


def base_unit_to_abbr(node):
    abbreviations = [''] * 5
    for child in node.children:
        abbreviation = ''
        if child.name == 'prefix':
            abbreviations[0] = abbr_mapping_prefixes[child.leaves[0].name]
        elif child.name == 'kind':
            abbreviations[1] = abbr_mapping[child.leaves[0].name]
        elif child.name == 'exponent':
            exp = child.leaves[0].name
            abbreviations[2] = trim_decimal_point(exp)
        else:
            print('Unknown child', child.name)

    return ''.join(abbreviations)


def derived_unit_to_abbr(node):
    abbreviations = [''] * 3
    counter = 0

    for child in node.children:
        if child.name == 'baseunit':
            abbreviations[counter] = base_unit_to_abbr(child)
            counter += 2
        elif child.name == 'operator':
            abbreviations[1] = opperator_mapping[child.leaves[0].name]
        else:
            print('Unknown child', child.name)
    return ''.join(abbreviations)


regex = r'(?<!\w)(\d+\.?\d*)\s([a-zA-Z0-9/*+-]+)(?!\w)'


def reverse_baseunit(value, prefix):
    if not value:
        return None
    base_unit = Node(name=prefix + 'baseunit')
    exp = None
    prefix_node = None
    kind = None
    # Ends with number -> exponent
    if re.search(r'\d+$', value):
        exp = Node(name=prefix + 'exponent')
        Node(name=prefix + value[-1] + '.0', parent=exp)
        value = value[:-1]
    # Ends with abbr -> kind
    for abbr, unit in reversed(abbr_mapping.items()):
        if value.endswith(unit):
            kind = Node(name=prefix + 'kind')
            Node(name=prefix + abbr, parent=kind)
            value = value[:-len(unit)]
            break
    # Remainder -> prefix
    for abbr, unit in reversed(abbr_mapping_prefixes.items()):
        if value == unit:
            prefix_node = Node(name=prefix + 'prefix')
            Node(name=prefix + abbr, parent=prefix_node)
            value = ''
            break

    base_unit.children = [i for i in [exp, prefix_node, kind] if i]

    if value != '':
        return None
    return base_unit


def reverse_units(lrml, prefix=' '):
    tree = parse_to_tree(lrml)
    data_nodes = findall(tree, filter_=lambda x: ((x.name.strip() == 'data')))
    for i in data_nodes:
        data_value = i.leaves[0].name.strip()
        if re.match(regex, data_value):
            if len(data_value.split(' ')) > 2:
                continue
            number = data_value.split(' ')[0]
            unit = data_value.split(' ')[1]
            unit_node = None
            # Derived Unit
            for operator_name, operator in opperator_mapping.items():
                split_unit = unit.split(operator)
                if len(split_unit) == 2:
                    first_unit = reverse_baseunit(split_unit[0], prefix=prefix)
                    second_unit = reverse_baseunit(
                        split_unit[1], prefix=prefix)
                    operator = Node(name=prefix + 'operator')
                    name_node = Node(name=prefix + 'name', parent=operator)
                    Node(name=operator_name, parent=name_node)
                    if first_unit and second_unit:
                        unit_node = Node(name=prefix + 'derivedunit', children=[
                                         first_unit, operator, second_unit])
                    break
            # Base unit
            if not unit_node:
                unit_node = reverse_baseunit(unit, prefix=prefix)

            if unit_node:
                value_node = Node(name=prefix + 'value')
                if not '.' in number:
                    number += '.0'

                Node(name=prefix + number, parent=value_node)
                i.children = [unit_node, value_node]

    return node_to_lrml(tree)


def get_node_path(node):
    path = ''
    while node:
        path = '/' + node.name + path
        node = node.parent
    return path


def find_non_data_leave_names(node):
    return [i.name for i in node.leaves if '/data/' not in str(i)]


def find_first_non_data_leave(node):
    return [i for i in node.leaves if '/data/' not in str(i)][0]


def find_data_node(node):
    data_node = [i for i in node.leaves if '/data/' in str(i)]
    assert len(data_node) == 1, (node, data_node)
    data_node = data_node[0]
    while data_node.name != 'data':
        data_node = data_node.parent
    return data_node


def find_next_and_or_node(node):
    while node and node.name != 'and' and node.name != 'or':
        node = node.parent
    return node


def find_max_express_node(node, include_deonitics=True):
    outside_options = ['not', 'expression', 'expr']
    if include_deonitics:
        outside_options += ['obligation', 'permission', 'prohibition']
    first_apearance = node.name.strip() in outside_options
    current_apperance = node.name.strip() in outside_options
    while node.parent:
        first_apearance += node.parent.name.strip() in outside_options
        current_apperance = node.parent.name.strip() in outside_options
        if node and (not first_apearance or (first_apearance and current_apperance)):
            node = node.parent
        else:
            break
    return node


def increase_indices(nodes, start_index, increase):
    for node in nodes:
        if node.node_id >= start_index:
            node.node_id += increase


def move_and_or_to_data_node(lrml):
    tree = parse_to_tree(lrml)
    and_nodes = findall(tree, filter_=lambda x: (
        (x.name == 'and') or (x.name == 'or')))
    for and_node in and_nodes:
        expr_nodes = list(dict.fromkeys([find_max_express_node(i) for i in findall(
            and_node, filter_=lambda x: ((x.name == 'expr')))]))
        # Find all expr nodes with the same parent and same children
        indices = []
        for index, expr_node in enumerate(expr_nodes):
            if index in indices:
                continue
            and_node = find_next_and_or_node(expr_node)
            similar_nodes = [expr_node]
            for index2, expr_node2 in enumerate(expr_nodes[index+1:]):
                if expr_node.parent and expr_node2.parent and expr_node.node_id != expr_node2.node_id and expr_node.parent.name == expr_node2.parent.name != 'expr' and \
                        expr_node.name == expr_node2.name and find_non_data_leave_names(expr_node) == find_non_data_leave_names(expr_node2) and \
                        find_next_and_or_node(expr_node) == find_next_and_or_node(expr_node2) and \
                        get_node_path(find_first_non_data_leave(expr_node)) == get_node_path(find_first_non_data_leave(expr_node2)):
                    similar_nodes.append(expr_node2)
                    indices.append(index+index2)
                else:
                    # Only for neighbouring nodes
                    break

            try:
                if len(similar_nodes) > 1:
                    data_nodes = [find_data_node(i) for i in similar_nodes]
                    for i in data_nodes:
                        assert len(i.children) == 1, (i, i.children)

                    new_and_node = Node(and_node.name, parent=data_nodes[0])

                    for similar_node in similar_nodes[1:]:
                        similar_node.parent = None
                        i.parent = new_and_node
                    new_and_node.children = [i.children[0] for i in data_nodes]
            except AssertionError:
                print('Cannot combine baseunit and value with other data')
            if and_node and len(and_node.children) == 1:
                remove_node(and_node)
    return node_to_lrml(tree)


def increase_indices(nodes, start_index, increase):
    for node in nodes:
        if node.node_id >= start_index:
            node.node_id += increase