import re
from anytree import Node, PreOrderIter, findall


def parse_to_tree(lrml: str):
    node_id = -1
    root_node = Node('root', node_id=node_id)
    new_node = None
    current_node = root_node
    current_word = ''
    quote = False
    for i in lrml:
        if i == "'":
            quote = not quote
            current_word += i
        elif not quote and (i == '(' or i == ')' or i == ','):
            if current_word:
                node_id += 1
                new_node = Node(current_word, current_node, node_id=node_id)
                current_word = ''
            if i == '(' and new_node is not None:
                current_node = new_node
            elif i == ')' and current_node.parent is not None:
                current_node = current_node.parent
        else:
            current_word += i
    if current_node == root_node and current_word:
        node_id += 1
        new_node = Node(current_word, current_node, node_id=node_id)
    return root_node


def node_to_lrml(node, stop_node=None, separator=','):
    initial_depth = node.depth
    last_depth = -1
    lrml = ''
    for i in PreOrderIter(node):
        if i.depth > last_depth:
            if last_depth != -1:
                lrml += '('
        else:
            last_depth - i.depth
            lrml += ')' * (last_depth - i.depth)
            lrml += separator
        if stop_node is not None and i.node_id == stop_node.node_id:
            break
        lrml += i.name
        last_depth = i.depth
    #   Only add brackets for full print
    if stop_node is None:
        lrml += ')' * (last_depth - initial_depth)
    #   Remove root node
    if node.is_root:
        lrml = lrml.replace('root(', '')
        if stop_node is None:
            lrml = lrml[:-1]
    return lrml


def swap_lrml_nodes(text):
    print(text)
    node = parse_to_tree(text.replace(' ', '').replace('\n', '').strip())
    and_or_node = findall(node, filter_=lambda x: (
        (x.name == 'and') | (x.name == 'or')))

    new_and_or_node = Node(and_or_node[0].name)
    print(new_and_or_node)
    new_and_or_node.children = [i.children[0] for i in and_or_node[0].children]
    and_or_node[0].name = and_or_node[0].children[0].name

    and_or_node[0].children = [new_and_or_node]
    return node_to_lrml(and_or_node[0])


abbr_mapping = {'metre': 'm', 'gram': 'g', 'litre': 'l', 'newton': 'N',
                'pascal': 'Pa', 'angleDegree': 'deg', 'celsius': 'degC', 'hectare': 'ha'}
abbr_mapping_prefixes = {'kilo': 'k', 'milli': 'm', 'mega': 'M'}
opperator_mapping = {'addition': '+', 'subtraction': '-',
                     'multiplication': '*', 'division': '/'}

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


def reverse_unit_string(data_value, prefix=' '):
    data_value = data_value.strip()
    if len(data_value.split(' ')) == 2 and not data_value.split(' ')[0].isalpha():
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
            data_node = Node(name=prefix + 'data',
                             children=[unit_node, value_node])
            return node_to_lrml(data_node)

    return data_value


def capitalize_or_underscore(text):
    # if text[0].isalpha():
    if text.isalpha():
        return text.capitalize()
    return '_' + text


def make_camel_case(text):
    text = ''.join([capitalize_or_underscore(j)
                   for j in text.strip().split(' ')])
    if text.startswith('_'):
        text = text[1:]
    text = text[0].lower() + text[1:]
    return text

# Remove space


def revert_tree_based_spacing(lrml):
    tree = parse_to_tree(lrml)
    for i in PreOrderIter(tree):
        if i.children:
            # Make Camel case except first word
            i.name = make_camel_case(i.name)
        else:
            if i.parent.name.strip() not in ['and', 'or'] and (not i.siblings or i.siblings[0].node_id > i.node_id):
                i.name = '.'.join([make_camel_case(i)
                                  for i in i.name.split('.')])
            else:
                if i.name.strip() != reverse_unit_string(i.name.strip()) or i.name.strip().startswith("'"):
                    i.name = i.name.strip()
                else:
                    i.name = make_camel_case(i.name)

    return node_to_lrml(tree).strip()


def fix_then(lrml, prefix):
    tree = parse_to_tree(lrml)
    if len(tree.children) == 1:
        thens = findall(tree, filter_=lambda x: ((x.name == prefix + 'then')))
        if len(thens) > 0:
            thens[0].parent = tree
    return node_to_lrml(tree)


def add_space_after_comma(lrml: str):
    tree = parse_to_tree(lrml)
    return node_to_lrml(tree, separator=', ')
