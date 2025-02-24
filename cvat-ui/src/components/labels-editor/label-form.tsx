// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React, { RefObject } from 'react';
import { Row, Col } from 'antd/lib/grid';
import Icon, { CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import Input from 'antd/lib/input';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Select from 'antd/lib/select';
import Form, { FormInstance } from 'antd/lib/form';
import Badge from 'antd/lib/badge';
import { Store } from 'antd/lib/form/interface';

import CVATTooltip from 'components/common/cvat-tooltip';
import ColorPicker from 'components/annotation-page/standard-workspace/objects-side-bar/color-picker';
import { ColorizeIcon } from 'icons';
import patterns from 'utils/validation-patterns';
import consts from 'consts';
import {
    equalArrayHead, idGenerator, Label, Attribute, Shapes
} from './common';
//import AddLabelShapes from "./add-shape";
import AddShape from './add-shape';
import { Multiselect } from 'multiselect-react-dropdown';
import { List, values } from 'lodash';
import labelItem from 'components/annotation-page/standard-workspace/objects-side-bar/label-item';
//import "../../../../.styles.scss"
//import { AddShapes } from './add-shape';

export enum AttributeType {
    SELECT = 'SELECT',
    RADIO = 'RADIO',
    CHECKBOX = 'CHECKBOX',
    TEXT = 'TEXT',
    NUMBER = 'NUMBER',
}

interface Props {
    label: Label | null;
    labelNames?: string[];
    labelShapes?: List<string>;
    onSubmit: (label: Label | null) => void;
}

export default class LabelForm extends React.Component<Props> {
    private continueAfterSubmit: boolean;
    private formRef: RefObject<FormInstance>;
    ShapeValue: List<string>[];

    constructor(props: Props) {
        super(props);
        this.continueAfterSubmit = false;
        this.formRef = React.createRef<FormInstance>();
        this.ShapeValue = []
    }

    private handleSubmit = (values: Store): void => {
        const { label, onSubmit } = this.props;
        console.log("+++++++++++++++++++")
        console.log(values)
        onSubmit({
            name: values.name,
            shapes: ,
            id: label ? label.id : idGenerator(),
            color: values.color,
            attributes: values.attributes.map((attribute: Store) => {
                let attrValues: string | string[] = attribute.values;
                if (!Array.isArray(attrValues)) {
                    if (attribute.type === AttributeType.NUMBER) {
                        attrValues = attrValues.split(';');
                    } else {
                        attrValues = [attrValues];
                    }
                }
                console.log("********")
                console.log(values)
                attrValues = attrValues.map((value: string) => value.trim());
                return {
                    ...attribute,
                    values: attrValues,
                    input_type: attribute.type.toLowerCase(),
                };
            }),
        });

        if (this.formRef.current) {
            this.formRef.current.resetFields();
            this.formRef.current.setFieldsValue({ attributes: [] });
        }

        if (!this.continueAfterSubmit) {
            onSubmit(null);
        }
    };

    private addAttribute = (): void => {
        if (this.formRef.current) {
            const attributes = this.formRef.current.getFieldValue('attributes');
            this.formRef.current.setFieldsValue({ attributes: [...attributes, { id: idGenerator() }] });
        }
    };

    private removeAttribute = (key: number): void => {
        if (this.formRef.current) {
            const attributes = this.formRef.current.getFieldValue('attributes');
            this.formRef.current.setFieldsValue({
                attributes: attributes.filter((_: any, id: number) => id !== key),
            });
        }
    };

    /* eslint-disable class-methods-use-this */
    private renderAttributeNameInput(fieldInstance: any, attr: Attribute | null): JSX.Element {
        const { key } = fieldInstance;
        const locked = attr ? attr.id >= 0 : false;
        const value = attr ? attr.name : '';

        return (
            <Form.Item
                hasFeedback
                name={[key, 'name']}
                fieldKey={[fieldInstance.fieldKey, 'name']}
                initialValue={value}
                rules={[
                    {
                        required: true,
                        message: 'Please specify a name',
                    },
                    {
                        pattern: patterns.validateAttributeName.pattern,
                        message: patterns.validateAttributeName.message,
                    },
                ]}
            >
                <Input className='cvat-attribute-name-input' disabled={locked} placeholder='Name' />
            </Form.Item>
        );
    }

    private renderAttributeTypeInput(fieldInstance: any, attr: Attribute | null): JSX.Element {
        const { key } = fieldInstance;
        const locked = attr ? attr.id >= 0 : false;
        const type = attr ? attr.input_type.toUpperCase() : AttributeType.SELECT;

        return (
            <CVATTooltip title='An HTML element representing the attribute'>
                <Form.Item name={[key, 'type']} fieldKey={[fieldInstance.fieldKey, 'type']} initialValue={type}>
                    <Select className='cvat-attribute-type-input' disabled={locked}>
                        <Select.Option value={AttributeType.SELECT} className='cvat-attribute-type-input-select'>
                            Select
                        </Select.Option>
                        <Select.Option value={AttributeType.RADIO} className='cvat-attribute-type-input-radio'>
                            Radio
                        </Select.Option>
                        <Select.Option value={AttributeType.CHECKBOX} className='cvat-attribute-type-input-checkbox'>
                            Checkbox
                        </Select.Option>
                        <Select.Option value={AttributeType.TEXT} className='cvat-attribute-type-input-text'>
                            Text
                        </Select.Option>
                        <Select.Option value={AttributeType.NUMBER} className='cvat-attribute-type-input-number'>
                            Number
                        </Select.Option>
                    </Select>
                </Form.Item>
            </CVATTooltip>
        );
    }

    private renderAttributeValuesInput(fieldInstance: any, attr: Attribute | null): JSX.Element {
        const { key } = fieldInstance;
        const locked = attr ? attr.id >= 0 : false;
        const existedValues = attr ? attr.values : [];

        const validator = (_: any, values: string[]): Promise<void> => {
            if (locked && existedValues) {
                if (!equalArrayHead(existedValues, values)) {
                    return Promise.reject(new Error('You can only append new values'));
                }
            }

            for (const value of values) {
                if (!patterns.validateAttributeValue.pattern.test(value)) {
                    return Promise.reject(new Error(`Invalid attribute value: "${value}"`));
                }
            }

            return Promise.resolve();
        };

        return (
            <CVATTooltip title='Press enter to add a new value'>
                <Form.Item
                    name={[key, 'values']}
                    fieldKey={[fieldInstance.fieldKey, 'values']}
                    initialValue={existedValues}
                    rules={[
                        {
                            required: true,
                            message: 'Please specify values',
                        },
                        {
                            validator,
                        },
                    ]}
                >
                    <Select
                        className='cvat-attribute-values-input'
                        mode='tags'
                        placeholder='Attribute values'
                        dropdownStyle={{ display: 'none' }}
                    />
                </Form.Item>
            </CVATTooltip>
        );
    }

    private renderBooleanValueInput(fieldInstance: any, attr: Attribute | null): JSX.Element {
        const { key } = fieldInstance;
        const value = attr ? attr.values[0] : 'false';

        return (
            <CVATTooltip title='Specify a default value'>
                <Form.Item name={[key, 'values']} fieldKey={[fieldInstance.fieldKey, 'values']} initialValue={value}>
                    <Select className='cvat-attribute-values-input'>
                        <Select.Option value='false'>False</Select.Option>
                        <Select.Option value='true'>True</Select.Option>
                    </Select>
                </Form.Item>
            </CVATTooltip>
        );
    }

    private renderNumberRangeInput(fieldInstance: any, attr: Attribute | null): JSX.Element {
        const { key } = fieldInstance;
        const locked = attr ? attr.id >= 0 : false;
        const value = attr ? attr.values : '';

        const validator = (_: any, strNumbers: string): Promise<void> => {
            const numbers = strNumbers.split(';').map((number): number => Number.parseFloat(number));
            if (numbers.length !== 3) {
                return Promise.reject(new Error('Three numbers are expected'));
            }

            for (const number of numbers) {
                if (Number.isNaN(number)) {
                    return Promise.reject(new Error(`"${number}" is not a number`));
                }
            }

            const [min, max, step] = numbers;

            if (min >= max) {
                return Promise.reject(new Error('Minimum must be less than maximum'));
            }

            if (max - min < step) {
                return Promise.reject(new Error('Step must be less than minmax difference'));
            }

            if (step <= 0) {
                return Promise.reject(new Error('Step must be a positive number'));
            }

            return Promise.resolve();
        };

        return (
            <Form.Item
                name={[key, 'values']}
                fieldKey={[fieldInstance.fieldKey, 'values']}
                initialValue={value}
                rules={[
                    {
                        required: true,
                        message: 'Please set a range',
                    },
                    {
                        validator,
                    },
                ]}
            >
                <Input className='cvat-attribute-values-input' disabled={locked} placeholder='min;max;step' />
            </Form.Item>
        );
    }

    private renderDefaultValueInput(fieldInstance: any, attr: Attribute | null): JSX.Element {
        const { key } = fieldInstance;
        const value = attr ? attr.values[0] : '';

        return (
            <Form.Item name={[key, 'values']} fieldKey={[fieldInstance.fieldKey, 'values']} initialValue={value}>
                <Input className='cvat-attribute-values-input' placeholder='Default value' />
            </Form.Item>
        );
    }

    private renderMutableAttributeInput(fieldInstance: any, attr: Attribute | null): JSX.Element {
        const { key } = fieldInstance;
        const locked = attr ? attr.id >= 0 : false;
        const value = attr ? attr.mutable : false;

        return (
            <CVATTooltip title='Can this attribute be changed frame to frame?'>
                <Form.Item
                    name={[key, 'mutable']}
                    fieldKey={[fieldInstance.fieldKey, 'mutable']}
                    initialValue={value}
                    valuePropName='checked'
                >
                    <Checkbox className='cvat-attribute-mutable-checkbox' disabled={locked}>
                        Mutable
                    </Checkbox>
                </Form.Item>
            </CVATTooltip>
        );
    }

    private renderDeleteAttributeButton(fieldInstance: any, attr: Attribute | null): JSX.Element {
        const { key } = fieldInstance;
        const locked = attr ? attr.id >= 0 : false;

        return (
            <CVATTooltip title='Delete the attribute'>
                <Form.Item>
                    <Button
                        type='link'
                        className='cvat-delete-attribute-button'
                        disabled={locked}
                        onClick={(): void => {
                            this.removeAttribute(key);
                        }}
                    >
                        <CloseCircleOutlined />
                    </Button>
                </Form.Item>
            </CVATTooltip>
        );
    }

    private renderAttribute = (fieldInstance: any): JSX.Element => {
        const { label } = this.props;
        const { key } = fieldInstance;
        const fieldValue = this.formRef.current?.getFieldValue('attributes')[key];
        const attr = label ? label.attributes.filter((_attr: any): boolean => _attr.id === fieldValue.id)[0] : null;

        return (
            <Form.Item noStyle key={key} shouldUpdate>
                {() => (
                    <Row
                        justify='space-between'
                        align='top'
                        cvat-attribute-id={fieldValue.id}
                        className='cvat-attribute-inputs-wrapper'
                    >
                        <Col span={5}>{this.renderAttributeNameInput(fieldInstance, attr)}</Col>
                        <Col span={4}>{this.renderAttributeTypeInput(fieldInstance, attr)}</Col>
                        <Col span={6}>
                            {((): JSX.Element => {
                                const currentFieldValue = this.formRef.current?.getFieldValue('attributes')[key];
                                const type = currentFieldValue.type || AttributeType.SELECT;
                                let element = null;
                                if ([AttributeType.SELECT, AttributeType.RADIO].includes(type)) {
                                    element = this.renderAttributeValuesInput(fieldInstance, attr);
                                } else if (type === AttributeType.CHECKBOX) {
                                    element = this.renderBooleanValueInput(fieldInstance, attr);
                                } else if (type === AttributeType.NUMBER) {
                                    element = this.renderNumberRangeInput(fieldInstance, attr);
                                } else {
                                    element = this.renderDefaultValueInput(fieldInstance, attr);
                                }

                                return element;
                            })()}
                        </Col>
                        <Col span={5}>{this.renderMutableAttributeInput(fieldInstance, attr)}</Col>
                        <Col span={2}>{this.renderDeleteAttributeButton(fieldInstance, attr)}</Col>
                    </Row>
                )}
            </Form.Item>
        );
    };

    private renderLabelNameInput(): JSX.Element {
        const { label, labelNames } = this.props;
        const value = label ? label.name : '';

        return (
            <Form.Item
                hasFeedback
                name="name"
                initialValue={value}
                rules={[
                    {
                        required: true,
                        message: 'Please specify a name',
                    },
                    {
                        pattern: patterns.validateAttributeName.pattern,
                        message: patterns.validateAttributeName.message,
                    },
                    {
                        validator: (_rule: any, labelName: string) => {
                            if (labelNames && labelNames.includes(labelName)) {
                                return Promise.reject(new Error('Label name must be unique for the task'));
                            }
                            return Promise.resolve();
                        },
                    },
                ]}
            >
                <Input placeholder='Label name' />
            </Form.Item>
        );
    }
    private AddShape2(event: any): JSX.Element{
        if(event.key == "Enter"){
            console.log("Enter Pressed")
            return(
            <Form.Item>
            <div>
                <h1>
                    Enter Pressed
                </h1>
            </div>
            </Form.Item>
            )
        }
        else{
            return(<div><h1>Enter Not Pressed</h1></div>)
        }
    }
    private handleChange(e: any){
        console.log('123123')
        var shapeList = []
        for(var i = 0 , le = e.length; i < le;i++) {
            shapeList.push({'name': e[i].name, 'id': e[i].id})
        }
        this.setState({
            ShapeValue: shapeList
        })

        // var options = e.target.options;
        // var value = [];
        // for (var i = 0, l = options.length; i < l; i++) {
        //   if (options[i].selected) {
        //     value.push(options[i].value);
        //   }
        // }
        // //this.props.labelShapes(value);
        // console.log(value)
    }
    private renderLabelShape(): JSX.Element {
        const { label, labelShapes } = this.props;
        const value = label ? label.shapes : [{'name': 'default', id: 0}];
        const options = [{name: 'Polygon', id: 1},{name: 'Line', id: 2},{name: 'Dot', id: 3}]
        return (
            <Form.Item
                hasFeedback
                name='shapes'
                initialValue={value}
                rules={[
                    {
                        pattern: patterns.validateAttributeName.pattern,
                        message: patterns.validateAttributeName.message,
                    },
                    // {
                    //     validator: (_rule: any, labelShape: string) => {
                    //         if (labelShapes && labelShapes.includes(labelShape)) {
                    //             return Promise.reject(new Error('Label shape must be unique for the task'));
                    //         }
                    //         return Promise.resolve();
                    //     },
                    // },
                ]}
            >
                {/* <Input placeholder='Label Shape'/> */}
                <Multiselect
                    options={options} // Options to display in the dropdown
                    //selectedValues= {"Default"} // Preselected value to persist in dropdown
                    onSelect={this.handleChange} // Function will trigger on select event
                    // onRemove={this.onRemove} // Function will trigger on remove event
                    displayValue="name" // Property name to display in the dropdown options
                />
            </Form.Item>
        );
    }

    private renderNewAttributeButton(): JSX.Element {
        return (
            <Form.Item>
                <Button type='ghost' onClick={this.addAttribute} className='cvat-new-attribute-button'>
                    Add an attribute
                    <PlusOutlined />
                </Button>
            </Form.Item>
        );
    }

    private renderDoneButton(): JSX.Element {
        return (
            <CVATTooltip title='Save the label and return'>
                <Button
                    style={{ width: '150px' }}
                    type='primary'
                    htmlType='submit'
                    onClick={(): void => {
                        this.continueAfterSubmit = false;
                    }}
                >
                    Done
                </Button>
            </CVATTooltip>
        );
    }

    private renderContinueButton(): JSX.Element | null {
        const { label } = this.props;

        if (label) return null;
        return (
            <CVATTooltip title='Save the label and create one more'>
                <Button
                    style={{ width: '150px' }}
                    type='primary'
                    htmlType='submit'
                    onClick={(): void => {
                        this.continueAfterSubmit = true;
                    }}
                >
                    Continue
                </Button>
            </CVATTooltip>
        );
    }

    private renderCancelButton(): JSX.Element {
        const { onSubmit } = this.props;

        return (
            <CVATTooltip title='Do not save the label and return'>
                <Button
                    type='primary'
                    danger
                    style={{ width: '150px' }}
                    onClick={(): void => {
                        onSubmit(null);
                    }}
                >
                    Cancel
                </Button>
            </CVATTooltip>
        );
    }

    private renderChangeColorButton(): JSX.Element {
        const { label } = this.props;

        return (
            <Form.Item noStyle shouldUpdate>
                {() => (
                    <Form.Item name='color' initialValue={label ? label?.color : undefined}>
                        <ColorPicker placement='bottom'>
                            <CVATTooltip title='Change color of the label'>
                                <Button type='default' className='cvat-change-task-label-color-button'>
                                    <Badge
                                        className='cvat-change-task-label-color-badge'
                                        color={this.formRef.current?.getFieldValue('color') || consts.NEW_LABEL_COLOR}
                                        text={<Icon component={ColorizeIcon} />}
                                    />
                                </Button>
                            </CVATTooltip>
                        </ColorPicker>
                    </Form.Item>
                )}
            </Form.Item>
        );
    }

    private renderAttributes() {
        return (fieldInstances: any[]): JSX.Element[] => fieldInstances.map(this.renderAttribute);
    }

    // eslint-disable-next-line react/sort-comp
    public componentDidMount(): void {
        const { label } = this.props;
        if (this.formRef.current) {
            const convertedAttributes = label ?
                label.attributes.map(
                    (attribute: Attribute): Store => ({
                        ...attribute,
                        values:
                              attribute.input_type.toUpperCase() === 'NUMBER' ?
                                  attribute.values.join(';') :
                                  attribute.values,
                        type: attribute.input_type.toUpperCase(),
                    }),
                ) :
                [];

            for (const attr of convertedAttributes) {
                delete attr.input_type;
            }

            this.formRef.current.setFieldsValue({ attributes: convertedAttributes });
        }
    }

    public render(): JSX.Element {
        return (
            <Form onFinish={this.handleSubmit} layout='vertical' ref={this.formRef}>
                <Row justify='start' align='top'>
                    <Col span={5}>{this.renderLabelNameInput()}</Col>
                    <Col span={5} style={{marginLeft: 20}}>{this.renderLabelShape()}</Col>
                    <Col span={3} offset={1}>
                        {this.renderChangeColorButton()}
                    </Col>
                    <Col span={6} offset={1}>
                        {this.renderNewAttributeButton()}
                    </Col>
                </Row>
                <Row justify='start' align='top'>
                    <Col span={24}>
                        <Form.List name='attributes'>{this.renderAttributes()}</Form.List>
                    </Col>
                </Row>
                <Row justify='start' align='middle'>
                    <Col>{this.renderDoneButton()}</Col>
                    <Col offset={1}>{this.renderContinueButton()}</Col>
                    <Col offset={1}>{this.renderCancelButton()}</Col>
                </Row>
            </Form>
        );
    }
}
